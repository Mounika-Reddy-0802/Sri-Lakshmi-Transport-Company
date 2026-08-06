// POST /api/invoices/generate — raise a month's invoices in one call.
//
// Before this, billing meant filling in the Add-invoice form once per student
// per month. The amount was always derivable (route.distanceKm × ratePerKm),
// it was just never computed.
//
// Idempotent by design: the run skips any student who already has an invoice
// for the period, so re-running it after adding three new students raises three
// invoices, not two hundred duplicates. The unique (studentId, period) index is
// the backstop if two runs race.
import { Router, type Request, type Response, type NextFunction } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "../db";
import { Invoice, Organization, Route, Student, type InvoiceDoc } from "../models";
import { badRequest, forbidden, notFound } from "../http/errors";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { idParam } from "./schemas";
import { objectIdSchema, zodValidate } from "../middleware/validate";

export const billingRouter = Router();

/** Company details printed on every receipt. */
const COMPANY = {
  name: "Sri Lakshmi Transport Company",
  short: "SLTC",
  email: "sltc.shyam6666@gmail.com",
  phone: "+91 81793 14684",
  area: "Hyderabad & Telangana",
};

/**
 * Loads an invoice the caller is allowed to see — admin anywhere, org within
 * its own tenant, a parent only for their own child.
 */
async function loadVisibleInvoice(req: Request, invoiceId: string): Promise<InvoiceDoc | null> {
  const auth = req.auth;
  if (!auth) throw forbidden("Authentication required.");

  const invoice = await Invoice.findById(invoiceId).lean<InvoiceDoc>().exec();
  if (!invoice) return null;
  if (auth.role === "admin") return invoice;

  if (!auth.organizationId) throw forbidden("This account is not linked to an organization.");
  if (invoice.organizationId.toString() !== auth.organizationId) return null;
  if (auth.role === "student" && invoice.studentId.toString() !== auth.studentId) return null;

  return invoice;
}

billingRouter.get(
  "/invoices/:id/receipt",
  requireAuth,
  zodValidate({ params: idParam }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const invoice = await loadVisibleInvoice(req, req.params.id as string);
      if (!invoice) {
        next(notFound("No invoice with that id."));
        return;
      }
      // A receipt is proof of payment — there is nothing to issue until then.
      if (invoice.status !== "paid") {
        next(badRequest("This invoice has not been paid, so it has no receipt."));
        return;
      }

      const student = await Student.findById(invoice.studentId).lean().exec();
      const [organization, route] = await Promise.all([
        Organization.findById(invoice.organizationId).lean().exec(),
        student?.routeId ? Route.findById(student.routeId).lean().exec() : null,
      ]);

      res.status(200).json({
        company: COMPANY,
        receiptNumber: invoice.razorpayPaymentId ?? invoice.invoiceNumber,
        issuedAt: invoice.paidAt ?? invoice.updatedAt,
        invoice: {
          _id: invoice._id.toString(),
          number: invoice.invoiceNumber,
          period: invoice.period,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          paidAt: invoice.paidAt,
        },
        payment: {
          paymentId: invoice.razorpayPaymentId ?? null,
          orderId: invoice.razorpayOrderId ?? null,
          method: invoice.razorpayPaymentId ? "Razorpay" : "Recorded manually",
        },
        student: student
          ? { name: student.name, code: student.studentCode, class: student.class, pickupPoint: student.pickupPoint }
          : null,
        organization: organization ? { name: organization.name, location: organization.location ?? null } : null,
        route: route ? { code: route.code, name: route.name, distanceKm: route.distanceKm } : null,
        ratePerKm: student?.ratePerKm ?? null,
      });
    } catch (error) {
      next(error);
    }
  },
);

const generateBody = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "must be formatted as YYYY-MM"),
  organizationId: objectIdSchema.optional(),
  /** Day of the month the invoices fall due. */
  dueDay: z.coerce.number().int().min(1).max(28).default(5),
  /** Preview without writing anything. */
  dryRun: z.boolean().optional().default(false),
});

type Skipped = { student: string; studentCode: string; reason: string };

billingRouter.post(
  "/invoices/generate",
  requireAuth,
  requireAdmin,
  zodValidate({ body: generateBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const { period, organizationId, dueDay, dryRun } = req.body as z.infer<typeof generateBody>;

      const [yearText, monthText] = period.split("-");
      const year = Number(yearText);
      const month = Number(monthText);
      if (month < 1 || month > 12) {
        next(badRequest("Month must be between 01 and 12."));
        return;
      }
      const dueDate = new Date(Date.UTC(year, month - 1, dueDay));

      const studentFilter: Record<string, unknown> = { isActive: true };
      if (organizationId) studentFilter.organizationId = new Types.ObjectId(organizationId);

      const students = await Student.find(studentFilter).lean().exec();
      if (students.length === 0) {
        res.status(200).json({
          period,
          created: 0,
          skipped: 0,
          candidates: 0,
          totalAmount: 0,
          skippedDetail: [],
          message: "No active students matched.",
        });
        return;
      }

      // Two bulk reads instead of two queries per student.
      const routeIds = students.map((s) => s.routeId).filter(Boolean) as Types.ObjectId[];
      const routes = await Route.find({ _id: { $in: routeIds } }).lean().exec();
      const routeById = new Map(routes.map((r) => [r._id.toString(), r]));

      const existing = await Invoice.find({
        period,
        studentId: { $in: students.map((s) => s._id) },
      })
        .select("studentId")
        .lean()
        .exec();
      const alreadyBilled = new Set(existing.map((i) => i.studentId.toString()));

      const toCreate: Record<string, unknown>[] = [];
      const skippedDetail: Skipped[] = [];

      for (const student of students) {
        const label = { student: student.name, studentCode: student.studentCode };

        if (alreadyBilled.has(student._id.toString())) {
          skippedDetail.push({ ...label, reason: "already invoiced for this period" });
          continue;
        }
        if (!student.routeId) {
          skippedDetail.push({ ...label, reason: "no route assigned" });
          continue;
        }

        const route = routeById.get(student.routeId.toString());
        if (!route) {
          skippedDetail.push({ ...label, reason: "assigned route not found" });
          continue;
        }

        const amount = Math.round(route.distanceKm * student.ratePerKm);
        if (amount <= 0) {
          skippedDetail.push({ ...label, reason: "computed fee is zero" });
          continue;
        }

        toCreate.push({
          invoiceNumber: `INV-${period.replace("-", "")}-${student.studentCode}`,
          studentId: student._id,
          organizationId: student.organizationId,
          period,
          amount,
          status: "pending",
          dueDate,
        });
      }

      const totalAmount = toCreate.reduce((sum, i) => sum + (i.amount as number), 0);

      if (dryRun) {
        res.status(200).json({
          period,
          dryRun: true,
          candidates: students.length,
          created: 0,
          wouldCreate: toCreate.length,
          skipped: skippedDetail.length,
          totalAmount,
          skippedDetail,
        });
        return;
      }

      // ordered:false so one bad row cannot abandon the rest of the batch.
      if (toCreate.length > 0) {
        await Invoice.insertMany(toCreate, { ordered: false });
      }

      res.status(201).json({
        period,
        candidates: students.length,
        created: toCreate.length,
        skipped: skippedDetail.length,
        totalAmount,
        skippedDetail,
      });
    } catch (error) {
      next(error);
    }
  },
);
