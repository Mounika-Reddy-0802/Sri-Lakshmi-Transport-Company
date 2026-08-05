"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import { refName, type StudentRecord } from "@/lib/resources";

export default function OrgStudentsPage() {
  return (
    <PortalShell role="org">
      <ResourcePage<StudentRecord>
        resource="students"
        title="Your students"
        subtitle="Everyone from your organization currently using transport."
        singular="student"
        rowKey={(s) => s._id}
        searchPlaceholder="Search name, ID, class or pickup…"
        emptyMessage="No students have been enrolled on transport yet."
        columns={[
          {
            header: "Student",
            cell: (s) => (
              <div>
                <div className="font-medium text-midnight dark:text-fog">{s.name}</div>
                <div className="text-xs text-muted2">
                  {s.studentCode} · {s.class}
                </div>
              </div>
            ),
          },
          { header: "Route", cell: (s) => <span className="text-muted2">{refName(s.routeId)}</span> },
          { header: "Pickup", cell: (s) => <span className="text-muted2">{s.pickupPoint}</span> },
          {
            header: "Parent",
            cell: (s) =>
              s.parent?.name ? (
                <div>
                  <div className="text-midnight dark:text-fog">{s.parent.name}</div>
                  <div className="text-xs text-muted2">{s.parent.phone ?? ""}</div>
                </div>
              ) : (
                <span className="text-muted2">—</span>
              ),
          },
          { header: "Status", cell: (s) => <StatusPill value={s.isActive === false ? "Inactive" : "Active"} /> },
        ]}
      />
    </PortalShell>
  );
}
