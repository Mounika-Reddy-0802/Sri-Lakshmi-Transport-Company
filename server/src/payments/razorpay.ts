// Razorpay SDK wrapper.
//
// Credentials are optional in config so every earlier phase runs without a
// Razorpay account. If an endpoint that genuinely needs them is called while
// they are absent, it fails with a clear 503 rather than a confusing crash.
import Razorpay from "razorpay";
import { env, hasPaymentCredentials } from "../config";
import { serviceUnavailable } from "../http/errors";

let client: Razorpay | null = null;

export { hasPaymentCredentials };

export function getRazorpayClient(): Razorpay {
  if (!hasPaymentCredentials) {
    throw serviceUnavailable(
      "Payments are not configured on this server.",
      { missing: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] },
    );
  }

  client ??= new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });

  return client;
}

/** Razorpay works in the smallest currency unit — paise, not rupees. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}
