"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import { refName, type RouteRecord } from "@/lib/resources";

export default function OrgRoutesPage() {
  return (
    <PortalShell role="org">
      <ResourcePage<RouteRecord>
        resource="routes"
        title="Your routes"
        subtitle="Distance determines each student's monthly fee."
        singular="route"
        rowKey={(r) => r._id}
        searchPlaceholder="Search code or name…"
        emptyMessage="No routes have been set up for your organization yet."
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
    </PortalShell>
  );
}
