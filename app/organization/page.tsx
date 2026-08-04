"use client";
import { useQuery } from "@tanstack/react-query";
import { Shell, Panel } from "@/components/dashboard/Shell";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/Charts";
import { ChartSkeleton, EmptyState, ErrorState, StatCardSkeleton, TableSkeleton } from "@/components/ui/States";
import { api, type OrgDashboard } from "@/lib/api";
import { RequireRole, useAuth } from "@/lib/auth";

const nav = [
  { label: "Overview", active: true }, { label: "Buses" }, { label: "Routes" },
  { label: "Students" }, { label: "Invoices" }, { label: "Documents" }, { label: "Reports" },
];

const tone: Record<string, string> = {
  Paid: "bg-steel/15 text-steel dark:text-mist",
  Pending: "bg-slate/15 text-slate",
  Overdue: "bg-slate/25 text-midnight dark:text-fog",
};

export default function OrganizationPage() {
  return (
    <RequireRole roles={["org"]}>
      <OrganizationDashboardView />
    </RequireRole>
  );
}

function OrganizationDashboardView() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const dashboard = useQuery({
    queryKey: ["dashboard", "organization", organizationId],
    queryFn: () => api.get<OrgDashboard>(`/dashboard/organization/${organizationId}`),
    enabled: Boolean(organizationId),
  });

  const d = dashboard.data;
  const orgName = d?.organization.name ?? user?.name ?? "Your organization";

  return (
    <Shell role="Organization" user={orgName} nav={nav}>
      <h1 className="display text-2xl text-midnight dark:text-fog">{orgName}</h1>
      <p className="mt-1 text-sm text-muted2">Your transport, routes and billing. You only see your own data.</p>

      {dashboard.isError ? (
        <div className="mt-6">
          <ErrorState
            message={dashboard.error instanceof Error ? dashboard.error.message : undefined}
            onRetry={() => void dashboard.refetch()}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.isPending
              ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              : d?.stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel title="Your monthly transport spend" action={<span className="text-xs text-muted2">Billed vs paid</span>}>
                {dashboard.isPending ? <ChartSkeleton /> : <RevenueChart data={d?.revenueTrend ?? []} />}
              </Panel>
            </div>
            <Panel title="Quick actions">
              <div className="space-y-2.5 text-sm">
                {["Download latest invoice", "Request a route change", "View transport report", "Manage student roster"].map((a) => (
                  <button key={a} className="w-full rounded-lg border hairline px-4 py-3 text-left text-midnight transition hover:bg-slate/10 dark:text-fog">{a}</button>
                ))}
              </div>
            </Panel>
          </div>

          <div className="mt-4">
            <Panel title="Students" action={<span className="text-xs text-muted2">Route assignment & fee status</span>}>
              {dashboard.isPending ? (
                <TableSkeleton />
              ) : (d?.students.length ?? 0) === 0 ? (
                <EmptyState message="No students have been enrolled on transport yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs uppercase tracking-wide text-muted2">
                      <th className="pb-2">ID</th><th className="pb-2">Name</th><th className="pb-2">Class</th><th className="pb-2">Route</th><th className="pb-2">Pickup</th><th className="pb-2">Fee</th>
                    </tr></thead>
                    <tbody>
                      {d?.students.map((s) => (
                        <tr key={s._id} className="border-t hairline">
                          <td className="py-2.5 text-muted2">{s.id}</td>
                          <td className="py-2.5 font-medium text-midnight dark:text-fog">{s.name}</td>
                          <td className="py-2.5 text-muted2">{s.grade}</td>
                          <td className="py-2.5 text-muted2">{s.route}</td>
                          <td className="py-2.5 text-muted2">{s.pickup}</td>
                          <td className="py-2.5"><span className={`rounded-full px-2.5 py-1 text-xs ${tone[s.status] ?? ""}`}>{s.status}</span></td>
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
