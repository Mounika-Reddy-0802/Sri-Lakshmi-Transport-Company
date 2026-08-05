"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { PageHeader, Panel } from "@/components/dashboard/Shell";
import { StatCard } from "@/components/dashboard/StatCard";
import { Checkout } from "@/components/dashboard/Checkout";
import { StatusPill } from "@/components/dashboard/DataTable";
import { EmptyState, ErrorState, StatCardSkeleton, TableSkeleton } from "@/components/ui/States";
import { api, type ListEnvelope, type StudentInvoice, type StudentProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function StudentFeesPage() {
  return (
    <PortalShell role="student">
      <FeesView />
    </PortalShell>
  );
}

function FeesView() {
  const { user } = useAuth();
  const studentId = user?.studentId;
  const [checkoutInvoice, setCheckoutInvoice] = useState<StudentInvoice | null>(null);

  const profile = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => api.get<StudentProfile>(`/students/${studentId}`),
    enabled: Boolean(studentId),
  });

  const invoices = useQuery({
    queryKey: ["student", studentId, "invoices"],
    queryFn: () => api.get<ListEnvelope<StudentInvoice>>(`/students/${studentId}/invoices?limit=50`),
    enabled: Boolean(studentId),
  });

  const rows = invoices.data?.data ?? [];
  const unpaid = rows.filter((i) => i.status !== "paid");
  const outstanding = unpaid.reduce((sum, i) => sum + i.amount, 0);
  const paidTotal = rows.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <PageHeader
        title="Fee & Payments"
        subtitle={
          profile.data
            ? `${profile.data.name} · ${profile.data.id} · ₹${(profile.data.monthlyFee ?? 0).toLocaleString("en-IN")} per month`
            : "Your transport fees and payment history."
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {invoices.isPending ? (
          Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Outstanding"
              value={`₹${outstanding.toLocaleString("en-IN")}`}
              delta={`${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"} due`}
              tone={outstanding > 0 ? "down" : "up"}
            />
            <StatCard label="Paid to date" value={`₹${paidTotal.toLocaleString("en-IN")}`} delta="settled" />
            <StatCard
              label="Monthly fee"
              value={`₹${(profile.data?.monthlyFee ?? 0).toLocaleString("en-IN")}`}
              delta={
                profile.data?.route
                  ? `${profile.data.route.distanceKm} km × ₹${profile.data.ratePerKm}`
                  : "route not assigned"
              }
            />
          </>
        )}
      </div>

      <div className="mt-6">
        <Panel
          title="Invoices"
          action={<span className="text-xs text-muted2">Oldest unpaid first</span>}
        >
          {invoices.isPending ? (
            <TableSkeleton rows={4} />
          ) : invoices.isError ? (
            <ErrorState message="Could not load your invoices." onRetry={() => void invoices.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState message="No invoices have been raised yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted2">
                    <th className="pb-2 pr-4">Invoice</th>
                    <th className="pb-2 pr-4">Period</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows]
                    .sort((a, b) => {
                      // Unpaid first, then most recent period.
                      if ((a.status === "paid") !== (b.status === "paid")) {
                        return a.status === "paid" ? 1 : -1;
                      }
                      return b.period.localeCompare(a.period);
                    })
                    .map((inv) => (
                      <tr key={inv._id} className="border-t hairline">
                        <td className="py-3 pr-4 font-medium text-midnight dark:text-fog">{inv.id}</td>
                        <td className="py-3 pr-4 text-muted2">{inv.period}</td>
                        <td className="py-3 pr-4 text-muted2">₹{inv.amount.toLocaleString("en-IN")}</td>
                        <td className="py-3 pr-4">
                          <StatusPill value={inv.status} />
                        </td>
                        <td className="py-3 pr-4 text-muted2">{inv.date}</td>
                        <td className="py-3 text-right">
                          {inv.status === "paid" ? (
                            <span className="text-xs text-muted2">Settled</span>
                          ) : (
                            <button
                              onClick={() => setCheckoutInvoice(inv)}
                              className="rounded-full bg-midnight px-4 py-1.5 text-xs font-medium text-white transition hover:bg-steel"
                            >
                              Pay ₹{inv.amount.toLocaleString("en-IN")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {checkoutInvoice && (
        <Checkout
          invoice={checkoutInvoice}
          studentName={profile.data?.name ?? "Student"}
          onClose={() => setCheckoutInvoice(null)}
        />
      )}
    </>
  );
}
