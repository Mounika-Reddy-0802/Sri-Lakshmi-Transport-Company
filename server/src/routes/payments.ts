// POST /api/payments/order   create a Razorpay order for an invoice
// POST /api/payments/verify  verify the signature and mark the invoice paid
//
// Threat model for /verify: the browser controls everything it posts here. The
// only trustworthy signal is the HMAC signature, which only Razorpay and this
// server can produce. On top of that the order id is checked against the one
// this server stored on the invoice, so a genuine signature from one payment
// cannot be replayed to settle a different invoice.
import { Router, type Request, type Response, type NextFunction } from "express";
import { Types } from "mongoose";
import { connectToDatabase } from "../db";
import { Invoice, Student, type InvoiceDoc } from "../models";
import { env } from "../config";
import { badRequest, conflict, forbidden, notFound } from "../http/errors";
import { requireAuth } from "../middleware/auth";
import { zodValidate } from "../middleware/validate";
import { getRazorpayClient, hasPaymentCredentials, toPaise } from "../payments/razorpay";
import { verifyPaymentSignature } from "../payments/signature";
import { markInvoicePaid } from "../payments/service";
import { paymentOrderBody, paymentVerifyBody } from "./schemas";

export const paymentsRouter = Router();

/**
 * Loads an invoice the caller is allowed to pay. Returns null when it does not
 * exist or is out of scope — indistinguishable to the caller, by design.
 */
async function loadPayableInvoice(req: Request, invoiceId: string): Promise<InvoiceDoc | null> {
  const auth = req.auth;
  if (!auth) throw forbidden("Authentication required.");

  const invoice = await Invoice.findById(invoiceId).lean<InvoiceDoc>().exec();
  if (!invoice) return null;

  if (auth.role === "admin") return invoice;

  if (!auth.organizationId) throw forbidden("This account is not linked to an organization.");
  if (invoice.organizationId.toString() !== auth.organizationId) return null;

  // A parent may only pay their own child's invoice.
  if (auth.role === "student" && invoice.studentId.toString() !== auth.studentId) return null;

  return invoice;
}

paymentsRouter.post(
  "/payments/order",
  requireAuth,
  zodValidate({ body: paymentOrderBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const { invoiceId } = req.body as { invoiceId: string };

      const invoice = await loadPayableInvoice(req, invoiceId);
      if (!invoice) {
        next(notFound("No invoice with that id."));
        return;
      }
      if (invoice.status === "paid") {
        next(conflict("This invoice has already been paid.", { invoiceId }));
        return;
      }

      const student = await Student.findById(invoice.studentId).lean().exec();

      // Throws a clean 503 when RAZORPAY_* are absent.
      const razorpay = getRazorpayClient();
      const order = await razorpay.orders.create({
        amount: toPaise(invoice.amount),
        currency: "INR",
        receipt: invoice.invoiceNumber,
        notes: {
          invoiceId: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          period: invoice.period,
          student: student?.name ?? "",
        },
      });

      // Remembered so /verify can bind the signature to this invoice.
      await Invoice.updateOne(
        { _id: invoice._id },
        { $set: { razorpayOrderId: String(order.id) } },
      ).exec();

      res.status(201).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: env.RAZORPAY_KEY_ID,
        invoice: {
          _id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          period: invoice.period,
          amount: invoice.amount,
        },
        student: student ? { name: student.name, code: student.studentCode } : null,
      });
    } catch (error) {
      next(error);
    }
  },
);

paymentsRouter.post(
  "/payments/verify",
  requireAuth,
  zodValidate({ body: paymentVerifyBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await connectToDatabase();
      const body = req.body as {
        invoiceId: string;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };

      const invoice = await loadPayableInvoice(req, body.invoiceId);
      if (!invoice) {
        next(notFound("No invoice with that id."));
        return;
      }

      // Replay guard: the order must be the one this server created for this
      // invoice. Without it, a valid signature could settle any invoice.
      if (invoice.razorpayOrderId && invoice.razorpayOrderId !== body.razorpay_order_id) {
        next(badRequest("This payment does not belong to the invoice."));
        return;
      }

      const valid = verifyPaymentSignature({
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        signature: body.razorpay_signature,
      });

      if (!valid) {
        // Deliberately terse: a tampering client learns nothing.
        next(badRequest("Payment signature verification failed."));
        return;
      }

      const result = await markInvoicePaid({
        invoiceId: new Types.ObjectId(body.invoiceId),
        razorpayOrderId: body.razorpay_order_id,
        razorpayPaymentId: body.razorpay_payment_id,
      });

      if (!result.invoice) {
        next(notFound("No invoice with that id."));
        return;
      }

      res.status(200).json({
        ok: true,
        alreadyPaid: result.alreadyPaid,
        invoice: {
          _id: result.invoice._id.toString(),
          invoiceNumber: result.invoice.invoiceNumber,
          period: result.invoice.period,
          amount: result.invoice.amount,
          status: result.invoice.status,
          paidAt: result.invoice.paidAt,
          receiptUrl: result.invoice.receiptUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/** Lets the frontend hide the pay button when the server has no credentials. */
paymentsRouter.get("/payments/config", requireAuth, (_req: Request, res: Response) => {
  res.status(200).json({
    configured: hasPaymentCredentials,
    keyId: hasPaymentCredentials ? env.RAZORPAY_KEY_ID : null,
  });
});
