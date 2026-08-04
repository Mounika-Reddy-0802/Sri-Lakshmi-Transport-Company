import { Schema, model, models, type Model, type Types } from "mongoose";
import { INVOICE_STATUSES, baseSchemaOptions, type InvoiceStatus } from "./common";

export type InvoiceDoc = {
  _id: Types.ObjectId;
  /** Human-facing id, e.g. "INV-2026-0431". */
  invoiceNumber: string;
  studentId: Types.ObjectId;
  /**
   * Denormalised from the student so invoice queries can be tenant-scoped
   * without a join. Kept in sync whenever a student changes organization.
   */
  organizationId: Types.ObjectId;
  /** Billing period as "YYYY-MM", e.g. "2026-06". */
  period: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

const invoiceSchema = new Schema<InvoiceDoc>(
  {
    invoiceNumber: { type: String, required: true, trim: true, uppercase: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    period: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}-\d{2}$/, "period must be formatted as YYYY-MM"],
    },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: INVOICE_STATUSES, default: "pending" },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    receiptUrl: { type: String, trim: true },
  },
  baseSchemaOptions,
);

invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
// One invoice per student per billing period — this is also what makes the
// seed and the Phase 6 payment flow safe to re-run.
invoiceSchema.index({ studentId: 1, period: 1 }, { unique: true });
invoiceSchema.index({ organizationId: 1, status: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
// Sparse: only paid invoices carry a Razorpay order.
invoiceSchema.index({ razorpayOrderId: 1 }, { sparse: true });

export const Invoice: Model<InvoiceDoc> =
  (models.Invoice as Model<InvoiceDoc>) ?? model<InvoiceDoc>("Invoice", invoiceSchema);
