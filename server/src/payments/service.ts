// Payment side effects on invoices.
//
// The one rule here: marking an invoice paid must be idempotent. Razorpay can
// deliver the same success more than once (browser callback, retry, and later
// a webhook), and a double-mark would corrupt the ledger.
import { Types } from "mongoose";
import { Invoice, type InvoiceDoc } from "../models";

export type MarkPaidInput = {
  invoiceId: Types.ObjectId | string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
};

export type MarkPaidResult = {
  invoice: InvoiceDoc | null;
  alreadyPaid: boolean;
};

/**
 * Flips an invoice to paid exactly once.
 *
 * The status guard lives in the query filter, so two concurrent verifies race
 * on the database rather than in application code: the first matches and
 * updates, the second matches nothing and is reported as already paid.
 */
export async function markInvoicePaid({
  invoiceId,
  razorpayOrderId,
  razorpayPaymentId,
}: MarkPaidInput): Promise<MarkPaidResult> {
  const updated = await Invoice.findOneAndUpdate(
    { _id: invoiceId, status: { $ne: "paid" } },
    {
      $set: {
        status: "paid",
        paidAt: new Date(),
        razorpayOrderId,
        razorpayPaymentId,
        // A path that actually resolves in the frontend, rather than the
        // dangling /receipts/<paymentId> this used to store.
        receiptUrl: `/student/receipts/${String(invoiceId)}`,
      },
    },
    { new: true, runValidators: true },
  )
    .lean<InvoiceDoc>()
    .exec();

  if (updated) return { invoice: updated, alreadyPaid: false };

  // Nothing matched: either the invoice is gone, or it was already paid.
  const existing = await Invoice.findById(invoiceId).lean<InvoiceDoc>().exec();
  return { invoice: existing, alreadyPaid: existing?.status === "paid" };
}
