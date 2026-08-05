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

export default function AdminRoutesPage() {
  return (
    <PortalShell role="admin">
      <RoutesView />
    </PortalShell>
  );
}

function RoutesView() {
  const orgs = useOptions<OrganizationRecord>("organizations");
  const buses = useOptions<BusRecord>("buses");
  const drivers = useOptions<DriverRecord>("drivers");

  const fields: Field[] = [
    { name: "code", label: "Route code", type: "text", required: true, placeholder: "SCH-A" },
    { name: "name", label: "Route name", type: "text", required: true, placeholder: "Jadcherla School Route A" },
    {
      name: "distanceKm",
      label: "Distance (km)",
      type: "number",
      required: true,
      min: 0,
      step: 0.5,
      help: "Student fees are distance × rate per km, so this drives billing.",
    },
    {
      name: "organizationId",
      label: "Organization",
      type: "select",
      required: true,
      options: (orgs.data?.data ?? []).map((o) => ({ value: o._id, label: o.name })),
    },
    {
      name: "busId",
      label: "Assigned bus",
      type: "select",
      options: (buses.data?.data ?? []).map((b) => ({ value: b._id, label: `${b.regNumber} · ${b.type}` })),
    },
    {
      name: "driverId",
      label: "Assigned driver",
      type: "select",
      options: (drivers.data?.data ?? []).map((d) => ({ value: d._id, label: d.name })),
    },
    { name: "isActive", label: "Route in service", type: "checkbox" },
  ];

  return (
    <ResourcePage<RouteRecord>
      resource="routes"
      title="Routes"
      subtitle="Distance drives the monthly fee, so keep it accurate."
      singular="route"
      rowKey={(r) => r._id}
      describe={(r) => `Route ${r.code} — ${r.name}`}
      searchPlaceholder="Search code or name…"
      emptyMessage="No routes have been created yet."
      canWrite
      fields={fields}
      columns={[
        {
          header: "Route",
          cell: (r) => (
            <div>
              <div className="font-medium text-midnight dark:text-fog">{r.code}</div>
              <div className="text-xs text-muted2">{r.name}</div>
            </div>
          ),
        },
        { header: "Distance", cell: (r) => <span className="text-muted2">{r.distanceKm} km</span> },
        { header: "Stops", cell: (r) => <span className="text-muted2">{r.pickupPoints?.length ?? 0}</span> },
        { header: "Bus", cell: (r) => <span className="text-muted2">{refName(r.busId, "regNumber")}</span> },
        { header: "Driver", cell: (r) => <span className="text-muted2">{refName(r.driverId)}</span> },
        { header: "Status", cell: (r) => <StatusPill value={r.isActive === false ? "Inactive" : "Active"} /> },
      ]}
    />
  );
}
