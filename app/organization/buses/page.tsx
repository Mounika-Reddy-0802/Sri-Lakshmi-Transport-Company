"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import { refName, type BusRecord } from "@/lib/resources";

export default function OrgBusesPage() {
  return (
    <PortalShell role="org">
      {/* Read-only: the server rejects writes from an org token, so the UI
          simply does not offer them. */}
      <ResourcePage<BusRecord>
        resource="buses"
        title="Your buses"
        subtitle="Vehicles assigned to your organization."
        singular="bus"
        rowKey={(b) => b._id}
        searchPlaceholder="Search registration or type…"
        emptyMessage="No vehicles are assigned to your organization yet."
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
          { header: "Route", cell: (b) => <span className="text-muted2">{refName(b.routeId)}</span> },
          { header: "Driver", cell: (b) => <span className="text-muted2">{refName(b.driverId)}</span> },
          { header: "Status", cell: (b) => <StatusPill value={b.status} /> },
        ]}
      />
    </PortalShell>
  );
}
