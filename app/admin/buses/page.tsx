"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import type { Field } from "@/components/dashboard/FormModal";
import {
  refName,
  useOptions,
  type BusRecord,
  type DriverRecord,
  type OrganizationRecord,
  type RouteRecord,
} from "@/lib/resources";

/** "2026-06-22T00:00:00.000Z" -> "22 Jun 2026", and flags anything imminent. */
function expiryCell(value?: string) {
  if (!value) return <span className="text-muted2">—</span>;
  const date = new Date(value);
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  const label = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (days < 0) return <span className="font-medium text-slate">{label} · expired</span>;
  if (days <= 30) return <span className="font-medium text-slate">{label} · {days}d</span>;
  return <span className="text-muted2">{label}</span>;
}

export default function AdminBusesPage() {
  return (
    <PortalShell role="admin">
      <BusesView />
    </PortalShell>
  );
}

function BusesView() {
  const orgs = useOptions<OrganizationRecord>("organizations");
  const routes = useOptions<RouteRecord>("routes");
  const drivers = useOptions<DriverRecord>("drivers");

  const fields: Field[] = [
    { name: "regNumber", label: "Registration number", type: "text", required: true, placeholder: "TS-09-AB-2231" },
    { name: "type", label: "Vehicle type", type: "text", required: true, placeholder: "44 Seater" },
    { name: "capacity", label: "Capacity (seats)", type: "number", required: true, min: 1, max: 100 },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: ["Active", "Maintenance", "Inactive"].map((v) => ({ value: v, label: v })),
    },
    { name: "isAc", label: "Air conditioned", type: "checkbox" },
    {
      name: "organizationId",
      label: "Organization",
      type: "select",
      options: (orgs.data?.data ?? []).map((o) => ({ value: o._id, label: o.name })),
      help: "Which client this vehicle is assigned to.",
    },
    {
      name: "routeId",
      label: "Route",
      type: "select",
      options: (routes.data?.data ?? []).map((r) => ({ value: r._id, label: `${r.code} · ${r.name}` })),
    },
    {
      name: "driverId",
      label: "Driver",
      type: "select",
      options: (drivers.data?.data ?? []).map((d) => ({ value: d._id, label: d.name })),
    },
    { name: "insurance.number", label: "Insurance policy no.", type: "text" },
    { name: "insurance.expiryDate", label: "Insurance expiry", type: "date" },
    { name: "fitness.expiryDate", label: "Fitness expiry", type: "date" },
    { name: "permit.expiryDate", label: "Permit expiry", type: "date" },
    { name: "puc.expiryDate", label: "PUC expiry", type: "date" },
  ];

  return (
    <ResourcePage<BusRecord>
      resource="buses"
      title="Buses"
      subtitle="Every vehicle in the SLTC fleet, with its assignment and statutory documents."
      singular="bus"
      rowKey={(b) => b._id}
      describe={(b) => `Bus ${b.regNumber}`}
      searchPlaceholder="Search registration or type…"
      emptyMessage="No vehicles have been added yet."
      canWrite
      fields={fields}
      columns={[
        {
          header: "Registration",
          cell: (b) => (
            <div>
              <div className="font-medium text-midnight dark:text-fog">{b.regNumber}</div>
              <div className="text-xs text-muted2">
                {b.type} · {b.capacity} seats{b.isAc ? " · AC" : ""}
              </div>
            </div>
          ),
        },
        { header: "Organization", cell: (b) => <span className="text-muted2">{refName(b.organizationId)}</span> },
        { header: "Route", cell: (b) => <span className="text-muted2">{refName(b.routeId)}</span> },
        { header: "Driver", cell: (b) => <span className="text-muted2">{refName(b.driverId)}</span> },
        { header: "Insurance", cell: (b) => expiryCell(b.insurance?.expiryDate) },
        { header: "Fitness", cell: (b) => expiryCell(b.fitness?.expiryDate) },
        { header: "Status", cell: (b) => <StatusPill value={b.status} /> },
      ]}
    />
  );
}
