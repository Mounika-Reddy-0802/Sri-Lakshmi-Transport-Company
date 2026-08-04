// Student-facing endpoints.
//
//   GET /api/students/:id           profile + route + bus + driver
//   GET /api/students/:id/invoices  that student's billing history
//
// Both are readable by an admin, by the student's own organization, and by the
// student themselves — and by nobody else. The guard is a single helper so the
// two endpoints cannot drift apart.
import { Router, type Request, type Response, type NextFunction } from "express";
import { Types } from "mongoose";
import { connectToDatabase } from "../db";
import { Bus, Driver, Invoice, Organization, Route, Student } from "../models";
import { forbidden, notFound } from "../http/errors";
import { longDate } from "../http/format";
import { requireAuth } from "../middleware/auth";
import { zodValidate } from "../middleware/validate";
import { idParam, listQuery } from "./schemas";

export const portalRouter = Router();

/**
 * Loads a student only if the caller is allowed to see them. Returns null when
 * the student does not exist OR is out of scope — the caller cannot tell which,
 * which is the point.
 */
async function loadVisibleStudent(req: Request, id: string) {
  const auth = req.auth;
  if (!auth) throw forbidden("Authentication required.");

  const student = await Student.findById(id).lean().exec();
  if (!student) return null;

  if (auth.role === "admin") return student;

  if (!auth.organizationId) throw forbidden("This account is not linked to an organization.");
  if (student.organizationId.toString() !== auth.organizationId) return null;

  // A parent may read their own child only, never a classmate.
  if (auth.role === "student" && student._id.toString() !== auth.studentId) return null;

  return student;
}

portalRouter.get(
  "/students/:id",
  requireAuth,
  zodValidate({ params: idParam }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const student = await loadVisibleStudent(req, req.params.id as string);
      if (!student) {
        next(notFound("No student with that id."));
        return;
      }

      const [organization, route] = await Promise.all([
        Organization.findById(student.organizationId).lean().exec(),
        student.routeId ? Route.findById(student.routeId).lean().exec() : null,
      ]);

      const [bus, driver] = await Promise.all([
        route?.busId ? Bus.findById(route.busId).lean().exec() : null,
        route?.driverId ? Driver.findById(route.driverId).lean().exec() : null,
      ]);

      const stop = route?.pickupPoints.find((p) => p.name === student.pickupPoint);

      // Shape mirrors `studentProfile` in the frontend's lib/mock-data.ts.
      res.status(200).json({
        id: student.studentCode,
        _id: student._id.toString(),
        name: student.name,
        org: organization?.name ?? null,
        grade: student.class,
        ratePerKm: student.ratePerKm,
        route: route
          ? { code: route.code, name: route.name, distanceKm: route.distanceKm }
          : null,
        pickup: {
          point: student.pickupPoint,
          time: stop?.pickupTime ?? null,
          drop: stop?.dropTime ?? null,
        },
        bus: bus ? { reg: bus.regNumber, type: bus.type } : null,
        driver: driver ? { name: driver.name, phone: driver.phone } : null,
        monthlyFee: route ? route.distanceKm * student.ratePerKm : null,
      });
    } catch (error) {
      next(error);
    }
  },
);

portalRouter.get(
  "/students/:id/invoices",
  requireAuth,
  zodValidate({ params: idParam, query: listQuery }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const student = await loadVisibleStudent(req, req.params.id as string);
      if (!student) {
        next(notFound("No student with that id."));
        return;
      }

      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const filter = { studentId: new Types.ObjectId(student._id) };

      const [invoices, total] = await Promise.all([
        Invoice.find(filter)
          .sort({ period: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean()
          .exec(),
        Invoice.countDocuments(filter).exec(),
      ]);

      // Shape mirrors `studentInvoices` in lib/mock-data.ts.
      res.status(200).json({
        data: invoices.map((invoice) => ({
          id: invoice.invoiceNumber,
          _id: invoice._id.toString(),
          period: invoice.period,
          amount: invoice.amount,
          status: invoice.status,
          date: invoice.paidAt ? longDate(invoice.paidAt) : `Due ${longDate(invoice.dueDate)}`,
          receiptUrl: invoice.receiptUrl ?? null,
        })),
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (error) {
      next(error);
    }
  },
);
