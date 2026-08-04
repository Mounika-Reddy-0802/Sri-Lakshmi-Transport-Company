// Razorpay payment signature verification.
//
// Razorpay signs `${order_id}|${payment_id}` with HMAC-SHA256 using the key
// secret. Verifying it is the ONLY thing that proves a payment actually
// happened — the browser's success callback is attacker-controlled and must
// never be trusted on its own.
//
// The secret is a parameter (defaulting to config) so this can be tested
// against a known key without a Razorpay account.
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config";

export type SignaturePayload = {
  orderId: string;
  paymentId: string;
  signature: string;
};

export function expectedSignature(orderId: string, paymentId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

/**
 * Constant-time comparison of the received signature against the expected one.
 * Returns false rather than throwing for any malformed input.
 */
export function verifyPaymentSignature(
  payload: SignaturePayload,
  secret: string = env.RAZORPAY_KEY_SECRET,
): boolean {
  const { orderId, paymentId, signature } = payload;
  if (!secret || !orderId || !paymentId || !signature) return false;

  const expected = expectedSignature(orderId, paymentId, secret);

  // timingSafeEqual throws on a length mismatch, which would itself leak
  // information, so the lengths are compared first and both branches return
  // the same way.
  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (received.length !== computed.length) return false;

  return timingSafeEqual(received, computed);
}

/**
 * Webhook bodies are signed over the raw request body instead of order|payment.
 * Included now so Phase 8's webhook has a verified path from day one.
 */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(computed, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
