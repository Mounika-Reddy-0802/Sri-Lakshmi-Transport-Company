"use client";
// A printable receipt.
//
// Deliberately not a server-generated PDF: the browser's own "Print → Save as
// PDF" produces a perfectly good file, needs no PDF dependency, and keeps the
// document behind the same auth as everything else. Phase 10 can replace this
// with a generated PDF for bulk export without changing the URL.
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { api } from "@/lib/api";

type Receipt = {
  company: { name: string; short: string; email: string; phone: string; area: string };
  receiptNumber: string;
  issuedAt: string;
  invoice: { _id: string; number: string; period: string; amount: number; dueDate: string; paidAt: string | null };
  payment: { paymentId: string | null; orderId: string | null; method: string };
  student: { name: string; code: string; class: string; pickupPoint: string } | null;
  organization: { name: string; location: string | null } | null;
  route: { code: string; name: string; distanceKm: number } | null;
  ratePerKm: number | null;
};

const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export default function ReceiptPage() {
  return (
    <PortalShell role="student">
      <ReceiptView />
    </PortalShell>
  );
}

function ReceiptView() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const receipt = useQuery({
    queryKey: ["receipt", id],
    queryFn: () => api.get<Receipt>(`/invoices/${id}/receipt`),
    enabled: Boolean(id),
  });

  if (receipt.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (receipt.isError || !receipt.data) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="Receipt unavailable"
          message={receipt.error instanceof Error ? receipt.error.message : undefined}
          onRetry={() => void receipt.refetch()}
        />
      </div>
    );
  }

  const r = receipt.data;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Controls are hidden when printing — only the receipt itself goes on paper. */}
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link
          href="/student/receipts"
          className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-midnight dark:hover:text-fog"
        >
          <ArrowLeft size={16} /> All receipts
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-sm font-medium text-white transition hover:bg-steel"
        >
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>

      <article className="surface rounded-xl2 p-8 print:border-0 print:shadow-none">
        <header className="flex items-start justify-between border-b hairline pb-6">
          <div>
            <h1 className="display text-xl text-midnight dark:text-fog">{r.company.name}</h1>
            <p className="mt-1 text-xs text-muted2">{r.company.area}</p>
            <p className="text-xs text-muted2">
              {r.company.phone} · {r.company.email}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-muted2">Receipt</div>
            <div className="mt-1 font-medium text-midnight dark:text-fog">{r.invoice.number}</div>
            <div className="text-xs text-muted2">{date(r.issuedAt)}</div>
          </div>
        </header>

        <section className="grid gap-6 border-b hairline py-6 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted2">Billed to</div>
            <p className="mt-2 font-medium text-midnight dark:text-fog">{r.student?.name ?? "—"}</p>
            <p className="text-sm text-muted2">
              {r.student?.code}
              {r.student?.class ? ` · ${r.student.class}` : ""}
            </p>
            <p className="text-sm text-muted2">{r.organization?.name ?? "—"}</p>
          </div>
          <div className="sm:text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-muted2">Payment</div>
            <p className="mt-2 text-sm text-midnight dark:text-fog">{r.payment.method}</p>
            {r.payment.paymentId && (
              <p className="break-all text-xs text-muted2">{r.payment.paymentId}</p>
            )}
            <p className="text-sm text-muted2">Paid {date(r.invoice.paidAt)}</p>
          </div>
        </section>

        <table className="w-full py-6 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted2">
              <th className="py-3">Description</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t hairline">
              <td className="py-4">
                <div className="font-medium text-midnight dark:text-fog">
                  School transport — {r.invoice.period}
                </div>
                {r.route && (
                  <div className="mt-1 text-xs text-muted2">
                    {r.route.code} · {r.route.name} · {r.route.distanceKm} km
                    {r.ratePerKm ? ` × ₹${r.ratePerKm}/km` : ""}
                  </div>
                )}
                {r.student?.pickupPoint && (
                  <div className="text-xs text-muted2">Pickup: {r.student.pickupPoint}</div>
                )}
              </td>
              <td className="py-4 text-right text-midnight dark:text-fog">
                ₹{r.invoice.amount.toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t hairline">
              <td className="py-4 font-medium text-midnight dark:text-fog">Total paid</td>
              <td className="py-4 text-right">
                <span className="display text-lg text-midnight dark:text-fog">
                  ₹{r.invoice.amount.toLocaleString("en-IN")}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="border-t hairline pt-5 text-xs text-muted2">
          This is a computer-generated receipt and is valid without a signature. Fees are calculated
          as route distance × rate per km. Queries: {r.company.email}
        </p>
      </article>
    </div>
  );
}
