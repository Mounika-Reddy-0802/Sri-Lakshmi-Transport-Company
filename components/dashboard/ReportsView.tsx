"use client";
// Financial reports, shared by the admin and organization portals.
//
// Both roles hit the same three endpoints; the server scopes the results, so an
// organization sees only its own numbers with no client-side filtering.
import { useQuery } from "@tanstack/react-query";
import { Panel, PageHeader } from "./Shell";
import { RevenueChart, RouteBarChart } from "./Charts";
import { StatCard } from "./StatCard";
import { ChartSkeleton, EmptyState, ErrorState, StatCardSkeleton, TableSkeleton } from "@/components/ui/States";
import { StatusPill } from "./DataTable";
import { api, type RouteRevenue, type TrendPoint } from "@/lib/api";

type RevenueReport = {
  data: (TrendPoint & { outstanding: number; invoices: number })[];
  totals: { revenue: number; collected: number; outstanding: number };
};

type PendingRow = {
  _id: string;
  invoiceNumber: string;
  student: string;
  studentCode: string;
  period: string;
  amount: number;
  status: string;
  dueDate: string;
};

type PendingReport = {
  data: PendingRow[];
  total: number;
  summary: { status: string; amount: number; count: number }[];
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function ReportsView({ subtitle }: { subtitle: string }) {
  const revenue = useQuery({
    queryKey: ["reports", "revenue"],
    queryFn: () => api.get<RevenueReport>("/reports/revenue?months=12"),
  });
  const routes = useQuery({
    queryKey: ["reports", "routes"],
    queryFn: () => api.get<{ data: RouteRevenue[] }>("/reports/routes"),
  });
  const pending = useQuery({
    queryKey: ["reports", "pending"],
    queryFn: () => api.get<PendingReport>("/reports/pending?limit=50"),
  });

  const totals = revenue.data?.totals;
  const collectionRate =
    totals && totals.revenue > 0 ? Math.round((totals.collected / totals.revenue) * 100) : 0;

  return (
    <>
      <PageHeader title="Reports" subtitle={subtitle} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {revenue.isPending ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total billed" value={inr(totals?.revenue ?? 0)} delta="all periods" />
            <StatCard label="Collected" value={inr(totals?.collected ?? 0)} delta={`${collectionRate}% of billed`} />
            <StatCard
              label="Outstanding"
              value={inr(totals?.outstanding ?? 0)}
              delta={`${pending.data?.total ?? 0} invoice${pending.data?.total === 1 ? "" : "s"}`}
              tone="down"
            />
            <StatCard
              label="Periods billed"
              value={String(revenue.data?.data.length ?? 0)}
              delta="months with invoices"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Billed vs collected" action={<span className="text-xs text-muted2">By month</span>}>
          {revenue.isPending ? (
            <ChartSkeleton />
          ) : revenue.isError ? (
            <ErrorState onRetry={() => void revenue.refetch()} />
          ) : (revenue.data?.data.length ?? 0) === 0 ? (
            <EmptyState message="No invoices have been raised yet." />
          ) : (
            <RevenueChart data={revenue.data?.data ?? []} />
          )}
        </Panel>

        <Panel title="Revenue by route">
          {routes.isPending ? (
            <ChartSkeleton />
          ) : routes.isError ? (
            <ErrorState onRetry={() => void routes.refetch()} />
          ) : (routes.data?.data.length ?? 0) === 0 ? (
            <EmptyState message="No route revenue recorded yet." />
          ) : (
            <RouteBarChart data={routes.data?.data ?? []} />
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel
          title="Outstanding invoices"
          action={
            pending.data?.summary?.length ? (
              <span className="text-xs text-muted2">
                {pending.data.summary.map((s) => `${s.count} ${s.status}`).join(" · ")}
              </span>
            ) : undefined
          }
        >
          {pending.isPending ? (
            <TableSkeleton />
          ) : pending.isError ? (
            <ErrorState onRetry={() => void pending.refetch()} />
          ) : (pending.data?.data.length ?? 0) === 0 ? (
            <EmptyState message="Nothing outstanding — every invoice is settled." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted2">
                    <th className="pb-2 pr-4">Invoice</th>
                    <th className="pb-2 pr-4">Student</th>
                    <th className="pb-2 pr-4">Period</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Due</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.data?.data.map((row) => (
                    <tr key={row._id} className="border-t hairline">
                      <td className="py-2.5 pr-4 font-medium text-midnight dark:text-fog">{row.invoiceNumber}</td>
                      <td className="py-2.5 pr-4">
                        <div className="text-midnight dark:text-fog">{row.student}</div>
                        <div className="text-xs text-muted2">{row.studentCode}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-muted2">{row.period}</td>
                      <td className="py-2.5 pr-4 text-muted2">{inr(row.amount)}</td>
                      <td className="py-2.5 pr-4 text-muted2">
                        {new Date(row.dueDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2.5">
                        <StatusPill value={row.status} />
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
  );
}
