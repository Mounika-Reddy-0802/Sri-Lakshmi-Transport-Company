import { Shell, Panel } from "@/components/dashboard/Shell";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart, RouteBarChart, OccupancyDonut } from "@/components/dashboard/Charts";
import { adminKpis, alerts, buses, organizations } from "@/lib/mock-data";
import { Bell } from "lucide-react";

const nav = [
  { label: "Overview", active: true }, { label: "Buses" }, { label: "Drivers" },
  { label: "Routes" }, { label: "Organizations" }, { label: "Students" },
  { label: "Payments" }, { label: "Documents" }, { label: "Taxes & EMI" }, { label: "Reports" },
];

const statusTone: Record<string, string> = {
  Active: "bg-steel/15 text-steel dark:text-mist",
  Maintenance: "bg-slate/15 text-slate",
};

export default function AdminDashboard() {
  return (
    <Shell role="Super Admin" user="SLTC Operations" nav={nav}>
      <h1 className="display text-2xl text-midnight dark:text-fog">Operations overview</h1>
      <p className="mt-1 text-sm text-muted2">Fleet, organizations and collections across SLTC.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminKpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Revenue vs collection" action={<span className="text-xs text-muted2">Last 6 months</span>}>
            <RevenueChart />
          </Panel>
        </div>
        <Panel title="Fleet occupancy">
          <OccupancyDonut />
          <div className="mt-2 flex justify-center gap-5 text-xs text-muted2">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-steel" />Occupied</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-mist" />Available</span>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Revenue by route">
            <RouteBarChart />
          </Panel>
        </div>
        <Panel title="Reminders & alerts" action={<Bell size={16} className="text-muted2" />}>
          <ul className="space-y-3">
            {alerts.map((a, i) => (
              <li key={i} className="rounded-lg border hairline p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-steel dark:text-mist">{a.kind}</span>
                  <span className="text-xs text-muted2">{a.due}</span>
                </div>
                <p className="mt-1 text-sm text-midnight dark:text-fog">{a.detail}</p>
                {"amount" in a && a.amount && <p className="mt-1 text-xs text-muted2">Amount · {a.amount}</p>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Fleet">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wide text-muted2">
                <th className="pb-2">Reg / Type</th><th className="pb-2">Route</th><th className="pb-2">Driver</th><th className="pb-2">Status</th>
              </tr></thead>
              <tbody>
                {buses.map((b) => (
                  <tr key={b.reg} className="border-t hairline">
                    <td className="py-2.5"><div className="font-medium text-midnight dark:text-fog">{b.reg}</div><div className="text-xs text-muted2">{b.type} · {b.org}</div></td>
                    <td className="py-2.5 text-muted2">{b.route}</td>
                    <td className="py-2.5 text-muted2">{b.driver}</td>
                    <td className="py-2.5"><span className={`rounded-full px-2.5 py-1 text-xs ${statusTone[b.status]}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Organizations">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wide text-muted2">
                <th className="pb-2">Organization</th><th className="pb-2">Students</th><th className="pb-2">Routes</th><th className="pb-2">Dues</th>
              </tr></thead>
              <tbody>
                {organizations.map((o) => (
                  <tr key={o.name} className="border-t hairline">
                    <td className="py-2.5"><div className="font-medium text-midnight dark:text-fog">{o.name}</div><div className="text-xs text-muted2">{o.type}</div></td>
                    <td className="py-2.5 text-muted2">{o.students.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 text-muted2">{o.routes}</td>
                    <td className={`py-2.5 ${o.dues === "₹0" ? "text-muted2" : "text-slate font-medium"}`}>{o.dues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
