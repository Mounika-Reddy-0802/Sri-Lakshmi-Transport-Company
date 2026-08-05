"use client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Shell, Panel } from "@/components/dashboard/Shell";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart, RouteBarChart, OccupancyDonut } from "@/components/dashboard/Charts";
import { ChartSkeleton, EmptyState, ErrorState, StatCardSkeleton, TableSkeleton } from "@/components/ui/States";
import { api, type AdminDashboard, type RouteRevenue } from "@/lib/api";
import { RequireRole, useAuth } from "@/lib/auth";

const statusTone: Record<string, string> = {
  Active: "bg-steel/15 text-steel dark:text-mist",
  Maintenance: "bg-slate/15 text-slate",
  Inactive: "bg-slate/15 text-slate",
};

export default function AdminPage() {
  return (
    <RequireRole roles={["admin"]}>
      <AdminDashboardView />
    </RequireRole>
  );
}

function AdminDashboardView() {
  const { user } = useAuth();

  const dashboard = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => api.get<AdminDashboard>("/dashboard/admin"),
  });

  const routes = useQuery({
    queryKey: ["reports", "routes"],
    queryFn: () => api.get<{ data: RouteRevenue[] }>("/reports/routes"),
  });

  const d = dashboard.data;

  return (
    <Shell role="admin" user={user?.name ?? "SLTC Operations"}>
      <h1 className="display text-2xl text-midnight dark:text-fog">Operations overview</h1>
      <p className="mt-1 text-sm text-muted2">Fleet, organizations and collections across SLTC.</p>

      {dashboard.isError ? (
        <div className="mt-6">
          <ErrorState
            message={dashboard.error instanceof Error ? dashboard.error.message : undefined}
            onRetry={() => void dashboard.refetch()}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.isPending
              ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
              : d?.kpis.map((k) => <StatCard key={k.label} {...k} />)}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel title="Revenue vs collection" action={<span className="text-xs text-muted2">Last 6 months</span>}>
                {dashboard.isPending ? <ChartSkeleton /> : <RevenueChart data={d?.revenueTrend ?? []} />}
              </Panel>
            </div>
            <Panel title="Fleet occupancy">
              {dashboard.isPending ? <ChartSkeleton /> : <OccupancyDonut data={d?.occupancy ?? []} />}
              <div className="mt-2 flex justify-center gap-5 text-xs text-muted2">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-steel" />Occupied</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-mist" />Available</span>
              </div>
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel title="Revenue by route">
                {routes.isPending ? (
                  <ChartSkeleton />
                ) : routes.isError ? (
                  <ErrorState message="Route revenue is unavailable." onRetry={() => void routes.refetch()} />
                ) : (routes.data?.data.length ?? 0) === 0 ? (
                  <EmptyState message="No route revenue recorded yet." />
                ) : (
                  <RouteBarChart data={routes.data?.data ?? []} />
                )}
              </Panel>
            </div>
            <Panel title="Reminders & alerts" action={<Bell size={16} className="text-muted2" />}>
              {dashboard.isPending ? (
                <TableSkeleton rows={5} />
              ) : (d?.alerts.length ?? 0) === 0 ? (
                <EmptyState message="Nothing due. All documents are current." />
              ) : (
                <ul className="space-y-3">
                  {d?.alerts.map((a, i) => (
                    <li key={i} className="rounded-lg border hairline p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-steel dark:text-mist">{a.kind}</span>
                        <span className="text-xs text-muted2">{a.due}</span>
                      </div>
                      <p className="mt-1 text-sm text-midnight dark:text-fog">{a.detail}</p>
                      {a.amount && <p className="mt-1 text-xs text-muted2">Amount · {a.amount}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Fleet">
              {dashboard.isPending ? (
                <TableSkeleton />
              ) : (d?.buses.length ?? 0) === 0 ? (
                <EmptyState message="No vehicles yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs uppercase tracking-wide text-muted2">
                      <th className="pb-2">Reg / Type</th><th className="pb-2">Route</th><th className="pb-2">Driver</th><th className="pb-2">Status</th>
                    </tr></thead>
                    <tbody>
                      {d?.buses.map((b) => (
                        <tr key={b.reg} className="border-t hairline">
                          <td className="py-2.5"><div className="font-medium text-midnight dark:text-fog">{b.reg}</div><div className="text-xs text-muted2">{b.type} · {b.org}</div></td>
                          <td className="py-2.5 text-muted2">{b.route}</td>
                          <td className="py-2.5 text-muted2">{b.driver}</td>
                          <td className="py-2.5"><span className={`rounded-full px-2.5 py-1 text-xs ${statusTone[b.status] ?? ""}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Organizations">
              {dashboard.isPending ? (
                <TableSkeleton />
              ) : (d?.organizations.length ?? 0) === 0 ? (
                <EmptyState message="No organizations yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs uppercase tracking-wide text-muted2">
                      <th className="pb-2">Organization</th><th className="pb-2">Students</th><th className="pb-2">Routes</th><th className="pb-2">Dues</th>
                    </tr></thead>
                    <tbody>
                      {d?.organizations.map((o) => (
                        <tr key={o._id} className="border-t hairline">
                          <td className="py-2.5"><div className="font-medium text-midnight dark:text-fog">{o.name}</div><div className="text-xs text-muted2">{o.type}</div></td>
                          <td className="py-2.5 text-muted2">{o.students.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 text-muted2">{o.routes}</td>
                          <td className={`py-2.5 ${o.dues === "₹0" ? "text-muted2" : "text-slate font-medium"}`}>{o.dues}</td>
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
    </Shell>
  );
}
