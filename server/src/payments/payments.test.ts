// Payment tests.
//
// These need no Razorpay account: the signature scheme is plain HMAC-SHA256,
// so a known secret is enough to produce genuine signatures and to prove that
// tampered ones are rejected. The idempotency test exercises the real database.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { Types } from "mongoose";
import { connectToDatabase, disconnectFromDatabase } from "../db";
import { Invoice, Organization, Student } from "../models";
import { expectedSignature, verifyPaymentSignature, verifyWebhookSignature } from "./signature";
import { markInvoicePaid } from "./service";

const SECRET = "rzp_test_secret_for_unit_tests";
const ORDER_ID = "order_ZZtestorder001";
const PAYMENT_ID = "pay_ZZtestpayment001";

let organizationId: Types.ObjectId;
let studentId: Types.ObjectId;
let invoiceId: Types.ObjectId;

beforeAll(async () => {
  await connectToDatabase();

  const org = await Organization.create({ name: "ZZ Payments Test Org", type: "School" });
  const student = await Student.create({
    studentCode: "ZZ-PAY-001",
    name: "Payments Test Child",
    class: "Grade 4",
    pickupPoint: "Test Gate",
    organizationId: org._id,
    ratePerKm: 100,
  });
  const invoice = await Invoice.create({
    invoiceNumber: "ZZ-PAY-INV-1",
    studentId: student._id,
    organizationId: org._id,
    period: "2026-03",
    amount: 1400,
    status: "pending",
    dueDate: new Date("2026-03-05"),
  });

  organizationId = org._id;
  studentId = student._id;
  invoiceId = invoice._id;
});

afterAll(async () => {
  await Promise.all([
    Invoice.deleteMany({ invoiceNumber: "ZZ-PAY-INV-1" }),
    Student.deleteMany({ studentCode: "ZZ-PAY-001" }),
    Organization.deleteMany({ name: "ZZ Payments Test Org" }),
  ]);
  await disconnectFromDatabase();
});

describe("payment signature verification", () => {
  it("accepts a genuine signature", () => {
    const signature = expectedSignature(ORDER_ID, PAYMENT_ID, SECRET);
    expect(
      verifyPaymentSignature({ orderId: ORDER_ID, paymentId: PAYMENT_ID, signature }, SECRET),
    ).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const signature = expectedSignature(ORDER_ID, PAYMENT_ID, SECRET);
    const tampered = `${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`;

    expect(
      verifyPaymentSignature({ orderId: ORDER_ID, paymentId: PAYMENT_ID, signature: tampered }, SECRET),
    ).toBe(false);
  });

  it("rejects a signature computed with a different secret", () => {
    const signature = expectedSignature(ORDER_ID, PAYMENT_ID, "someone-elses-secret");
    expect(
      verifyPaymentSignature({ orderId: ORDER_ID, paymentId: PAYMENT_ID, signature }, SECRET),
    ).toBe(false);
  });

  it("rejects a signature bound to a different order (no replay)", () => {
    // A real signature, but for another order — must not settle this one.
    const signature = expectedSignature("order_SOMETHINGELSE", PAYMENT_ID, SECRET);
    expect(
      verifyPaymentSignature({ orderId: ORDER_ID, paymentId: PAYMENT_ID, signature }, SECRET),
    ).toBe(false);
  });

  it("rejects a signature bound to a different payment", () => {
    const signature = expectedSignature(ORDER_ID, "pay_SOMETHINGELSE", SECRET);
    expect(
      verifyPaymentSignature({ orderId: ORDER_ID, paymentId: PAYMENT_ID, signature }, SECRET),
    ).toBe(false);
  });

  it("rejects empty, short and missing input instead of throwing", () => {
    expect(verifyPaymentSignature({ orderId: ORDER_ID, paymentId: PAYMENT_ID, signature: "" }, SECRET)).toBe(false);
    expect(verifyPaymentSignature({ orderId: ORDER_ID, paymentId: PAYMENT_ID, signature: "abc" }, SECRET)).toBe(false);
    expect(verifyPaymentSignature({ orderId: "", paymentId: PAYMENT_ID, signature: "x" }, SECRET)).toBe(false);
    expect(
      verifyPaymentSignature({ orderId: ORDER_ID, paymentId: PAYMENT_ID, signature: "x" }, ""),
    ).toBe(false);
  });

  it("verifies webhook signatures over the raw body", () => {
    const body = JSON.stringify({ event: "payment.captured", id: PAYMENT_ID });
    const good = expectedWebhookSignature(body);
    expect(verifyWebhookSignature(body, good, SECRET)).toBe(true);
    expect(verifyWebhookSignature(`${body} `, good, SECRET)).toBe(false);
  });
});

/** Computed independently of the helper under test, on purpose. */
function expectedWebhookSignature(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

describe("marking an invoice paid", () => {
  it("flips a pending invoice to paid exactly once", async () => {
    const before = await Invoice.findById(invoiceId).lean().exec();
    expect(before?.status).toBe("pending");

    const first = await markInvoicePaid({
      invoiceId,
      razorpayOrderId: ORDER_ID,
      razorpayPaymentId: PAYMENT_ID,
    });

    expect(first.alreadyPaid).toBe(false);
    expect(first.invoice?.status).toBe("paid");
    expect(first.invoice?.razorpayPaymentId).toBe(PAYMENT_ID);
    expect(first.invoice?.paidAt).toBeInstanceOf(Date);
  });

  it("is idempotent — a second verify does not re-pay or overwrite", async () => {
    const paidAtAfterFirst = (await Invoice.findById(invoiceId).lean().exec())?.paidAt;

    const second = await markInvoicePaid({
      invoiceId,
      razorpayOrderId: ORDER_ID,
      razorpayPaymentId: "pay_A_DIFFERENT_PAYMENT",
    });

    expect(second.alreadyPaid).toBe(true);
    expect(second.invoice?.status).toBe("paid");
    // The original payment id and timestamp must survive.
    expect(second.invoice?.razorpayPaymentId).toBe(PAYMENT_ID);
    expect(second.invoice?.paidAt?.getTime()).toBe(paidAtAfterFirst?.getTime());
  });

  it("reports a missing invoice rather than inventing one", async () => {
    const result = await markInvoicePaid({
      invoiceId: new Types.ObjectId(),
      razorpayOrderId: ORDER_ID,
      razorpayPaymentId: PAYMENT_ID,
    });

    expect(result.invoice).toBeNull();
    expect(result.alreadyPaid).toBe(false);
  });

  it("leaves the fixture consistent for the rest of the suite", async () => {
    const invoice = await Invoice.findById(invoiceId).lean().exec();
    expect(invoice?.organizationId.toString()).toBe(organizationId.toString());
    expect(invoice?.studentId.toString()).toBe(studentId.toString());
  });
});
