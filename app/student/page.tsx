"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bus, MapPin, Clock, Phone, Download } from "lucide-react";
import { Shell, Panel } from "@/components/dashboard/Shell";
import { Checkout } from "@/components/dashboard/Checkout";
import { ChartSkeleton, EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { api, type ListEnvelope, type StudentInvoice, type StudentProfile } from "@/lib/api";
import { RequireRole, useAuth } from "@/lib/auth";

const plans = [
  { key: "Monthly", months: 1 },
  { key: "Quarterly", months: 3 },
  { key: "Half-Yearly", months: 6 },
  { key: "Full Year", months: 12 },
];

const tone: Record<string, string> = {
  paid: "bg-steel/15 text-steel dark:text-mist",
  pending: "bg-slate/15 text-slate",
  overdue: "bg-slate/25 text-midnight dark:text-fog",
};

const statusLabel: Record<string, string> = { paid: "Paid", pending: "Pending", overdue: "Overdue" };

export default function StudentPage() {
  return (
    <RequireRole roles={["student"]}>
      <StudentDashboardView />
    </RequireRole>
  );
}

function StudentDashboardView() {
  const { user } = useAuth();
  const studentId = user?.studentId;

  const [plan, setPlan] = useState(plans[0]);
  // Payments settle a specific invoice, so the checkout is opened against one
  // rather than against a plan total.
  const [checkoutInvoice, setCheckoutInvoice] = useState<StudentInvoice | null>(null);

  const profile = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => api.get<StudentProfile>(`/students/${studentId}`),
    enabled: Boolean(studentId),
  });

  const invoices = useQuery({
    queryKey: ["student", studentId, "invoices"],
    queryFn: () => api.get<ListEnvelope<StudentInvoice>>(`/students/${studentId}/invoices`),
    enabled: Boolean(studentId),
  });

  const p = profile.data;
  const monthly = p?.monthlyFee ?? 0;
  const total = monthly * plan.months;

  // Oldest unsettled invoice — what the primary Pay button targets.
  const nextDue = [...(invoices.data?.data ?? [])]
    .filter((i) => i.status !== "paid")
    .sort((a, b) => a.period.localeCompare(b.period))[0];

  return (
    <Shell role="student" user={p?.name ?? user?.name ?? "Parent"}>
      <h1 className="display text-2xl text-midnight dark:text-fog">
        Hello, {(p?.name ?? user?.name ?? "there").split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-muted2">
        {profile.isPending ? "Loading your transport details…" : `${p?.org ?? "—"} · ${p?.grade ?? "—"} · ${p?.id ?? "—"}`}
      </p>

      {profile.isError ? (
        <div className="mt-6">
          <ErrorState
            message={profile.error instanceof Error ? profile.error.message : undefined}
            onRetry={() => void profile.refetch()}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Panel title="Your route">
              {profile.isPending ? (
                <ChartSkeleton height="h-32" />
              ) : (
                <div className="space-y-3 text-sm">
                  <Row icon={<MapPin size={16} />} label="Route" value={p?.route ? `${p.route.code} · ${p.route.name}` : "Not assigned"} />
                  <Row icon={<MapPin size={16} />} label="Pickup point" value={p?.pickup.point ?? "—"} />
                  <Row icon={<Clock size={16} />} label="Pickup / Drop" value={p?.pickup.time ? `${p.pickup.time} → ${p.pickup.drop ?? "—"}` : "—"} />
                  <Row icon={<MapPin size={16} />} label="Distance" value={p?.route ? `${p.route.distanceKm} km` : "—"} />
                </div>
              )}
            </Panel>

            <Panel title="Your bus">
              {profile.isPending ? (
                <ChartSkeleton height="h-32" />
              ) : (
                <div className="space-y-3 text-sm">
                  <Row icon={<Bus size={16} />} label="Vehicle" value={p?.bus?.reg ?? "Not assigned"} />
                  <Row icon={<Bus size={16} />} label="Type" value={p?.bus?.type ?? "—"} />
                  <Row icon={<Phone size={16} />} label="Driver" value={p?.driver?.name ?? "—"} />
                  <Row icon={<Phone size={16} />} label="Contact" value={p?.driver?.phone ?? "—"} />
                </div>
              )}
            </Panel>

            <Panel title="Fee calculation">
              {profile.isPending ? (
                <ChartSkeleton height="h-48" />
              ) : (
                <>
                  <p className="text-sm text-muted2">Monthly fee = distance × rate per km</p>
                  <p className="mt-2 text-sm text-midnight dark:text-fog">
                    {p?.route?.distanceKm ?? 0} km × ₹{p?.ratePerKm ?? 0} ={" "}
                    <span className="font-semibold">₹{monthly.toLocaleString("en-IN")}/mo</span>
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {plans.map((pl) => (
                      <button key={pl.key} onClick={() => setPlan(pl)}
                        className={`rounded-lg border px-3 py-2 text-xs transition ${plan.key === pl.key ? "border-steel bg-steel/10 font-medium text-steel dark:text-mist" : "hairline text-muted2 hover:bg-slate/10"}`}>
                        {pl.key}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-steel/8 p-3">
                    <span className="text-sm text-muted2">{plan.key} estimate</span>
                    <span className="display text-lg text-midnight dark:text-fog">₹{total.toLocaleString("en-IN")}</span>
                  </div>

                  <button
                    onClick={() => nextDue && setCheckoutInvoice(nextDue)}
                    disabled={!nextDue}
                    className="mt-3 w-full rounded-full bg-midnight px-5 py-3 text-sm font-medium text-white transition hover:bg-steel disabled:opacity-50"
                  >
                    {nextDue
                      ? `Pay ${nextDue.period} · ₹${nextDue.amount.toLocaleString("en-IN")}`
                      : "Nothing due"}
                  </button>
                  <p className="mt-2 text-center text-xs text-muted2">
                    {nextDue
                      ? "Fees are billed monthly — this settles your oldest unpaid invoice."
                      : "All invoices are settled."}
                  </p>
                </>
              )}
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title="Payment history">
              {invoices.isPending ? (
                <TableSkeleton />
              ) : invoices.isError ? (
                <ErrorState message="Could not load your invoices." onRetry={() => void invoices.refetch()} />
              ) : (invoices.data?.data.length ?? 0) === 0 ? (
                <EmptyState message="No invoices have been raised yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs uppercase tracking-wide text-muted2">
                      <th className="pb-2">Invoice</th><th className="pb-2">Period</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Date</th><th className="pb-2"></th>
                    </tr></thead>
                    <tbody>
                      {invoices.data?.data.map((inv) => (
                        <tr key={inv._id} className="border-t hairline">
                          <td className="py-2.5 font-medium text-midnight dark:text-fog">{inv.id}</td>
                          <td className="py-2.5 text-muted2">{inv.period}</td>
                          <td className="py-2.5 text-muted2">₹{inv.amount.toLocaleString("en-IN")}</td>
                          <td className="py-2.5"><span className={`rounded-full px-2.5 py-1 text-xs ${tone[inv.status] ?? ""}`}>{statusLabel[inv.status] ?? inv.status}</span></td>
                          <td className="py-2.5 text-muted2">{inv.date}</td>
                          <td className="py-2.5">
                            {inv.status === "paid" ? (
                              <button className="inline-flex items-center gap-1 text-xs text-steel dark:text-mist"><Download size={13} /> Receipt</button>
                            ) : (
                              <button
                                onClick={() => setCheckoutInvoice(inv)}
                                className="rounded-full border hairline px-3 py-1 text-xs font-medium text-midnight transition hover:bg-slate/10 dark:text-fog"
                              >
                                Pay now
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
        </>
      )}

      {checkoutInvoice && (
        <Checkout
          invoice={checkoutInvoice}
          studentName={p?.name ?? "Student"}
          onClose={() => setCheckoutInvoice(null)}
        />
      )}
    </Shell>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-muted2">{icon}{label}</span>
      <span className="text-right font-medium text-midnight dark:text-fog">{value}</span>
    </div>
  );
}
