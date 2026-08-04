"use client";
// Razorpay checkout.
//
// Flow: ask our API for an order -> open Razorpay's widget -> hand what it
// returns back to our API for signature verification. The browser's success
// callback is never trusted on its own; only /payments/verify decides whether
// an invoice is paid.
//
// When the server has no Razorpay credentials (GET /payments/config reports
// configured:false) the component says so plainly instead of failing obscurely.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { ApiError, api, type StudentInvoice } from "@/lib/api";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type OrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  invoice: { _id: string; invoiceNumber: string; period: string; amount: number };
  student: { name: string; code: string } | null;
};

type RazorpayResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (result: RazorpayResult) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/** Loads Razorpay's script once, on demand. */
function useRazorpayScript(enabled: boolean) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (window.Razorpay) {
      setReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => setReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, [enabled]);

  return ready;
}

export function Checkout({
  invoice,
  studentName,
  onClose,
}: {
  invoice: StudentInvoice;
  studentName: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const config = useQuery({
    queryKey: ["payments", "config"],
    queryFn: () => api.get<{ configured: boolean; keyId: string | null }>("/payments/config"),
  });

  const scriptReady = useRazorpayScript(config.data?.configured === true);

  const verify = useMutation({
    mutationFn: (result: RazorpayResult) =>
      api.post<{ ok: boolean; alreadyPaid: boolean }>("/payments/verify", {
        invoiceId: invoice._id,
        ...result,
      }),
    onSuccess: () => {
      setDone(true);
      // Pull the new status through rather than guessing it locally.
      void queryClient.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not verify the payment.");
    },
  });

  const startPayment = useMutation({
    mutationFn: () => api.post<OrderResponse>("/payments/order", { invoiceId: invoice._id }),
    onSuccess: (order) => {
      if (!window.Razorpay) {
        setError("Razorpay checkout could not be loaded. Check your connection and try again.");
        return;
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Sri Lakshmi Transport Company",
        description: `Transport fee · ${order.invoice.period}`,
        order_id: order.orderId,
        prefill: { name: order.student?.name ?? studentName },
        theme: { color: "#2A2E3A" },
        handler: (result) => verify.mutate(result),
        modal: {
          // Cancelling is not a failure — just close and let them retry.
          ondismiss: () => setError(null),
        },
      });

      checkout.open();
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not start the payment. Please try again.",
      );
    },
  });

  const busy = startPayment.isPending || verify.isPending;
  const configured = config.data?.configured === true;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" onClick={onClose}>
      <div className="w-full max-w-sm surface rounded-xl2 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="display text-midnight dark:text-fog">
            {done ? "Payment complete" : "Pay transport fee"}
          </span>
          <button onClick={onClose} className="text-muted2" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="text-steel dark:text-mist" size={42} />
            <p className="display mt-3 text-lg text-midnight dark:text-fog">Payment successful</p>
            <p className="mt-1 text-sm text-muted2">
              ₹{invoice.amount.toLocaleString("en-IN")} · {invoice.period} · receipt generated.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-full bg-midnight px-5 py-3 text-sm font-medium text-white hover:bg-steel"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted2">
              {studentName} · {invoice.period}
            </p>
            <div className="mt-2 display text-2xl text-midnight dark:text-fog">
              ₹{invoice.amount.toLocaleString("en-IN")}
            </div>
            <p className="mt-1 text-xs text-muted2">Invoice {invoice.id}</p>

            {config.isPending ? (
              <p className="mt-6 text-sm text-muted2">Checking payment availability…</p>
            ) : !configured ? (
              <div className="mt-5 rounded-lg border hairline p-4 text-sm text-muted2">
                Online payment is not enabled on this server yet. Add your Razorpay test keys to
                <code className="mx-1 rounded bg-slate/10 px-1.5 py-0.5 text-xs">server/.env</code>
                and restart the API.
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  {["UPI", "Debit Card", "Credit Card", "Net Banking"].map((m) => (
                    <span key={m} className="rounded-lg border hairline px-3 py-2 text-center text-muted2">
                      {m}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setError(null);
                    startPayment.mutate();
                  }}
                  disabled={busy || !scriptReady}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-midnight px-5 py-3 text-sm font-medium text-white transition hover:bg-steel disabled:opacity-60"
                >
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  {verify.isPending
                    ? "Verifying…"
                    : startPayment.isPending
                      ? "Opening checkout…"
                      : scriptReady
                        ? `Pay ₹${invoice.amount.toLocaleString("en-IN")}`
                        : "Loading checkout…"}
                </button>
              </>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-slate/10 px-4 py-3 text-sm text-midnight dark:text-fog">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
