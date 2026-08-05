"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import type { Field } from "@/components/dashboard/FormModal";
import {
  refName,
  useOptions,
  type OrganizationRecord,
  type RouteRecord,
  type StudentRecord,
} from "@/lib/resources";

export default function AdminStudentsPage() {
  return (
    <PortalShell role="admin">
      <StudentsView />
    </PortalShell>
  );
}

function StudentsView() {
  const orgs = useOptions<OrganizationRecord>("organizations");
  const routes = useOptions<RouteRecord>("routes");

  const fields: Field[] = [
    { name: "studentCode", label: "Student ID", type: "text", required: true, placeholder: "SV-1042" },
    { name: "name", label: "Student name", type: "text", required: true },
    { name: "class", label: "Class / grade", type: "text", required: true, placeholder: "Grade 7-B" },
    {
      name: "organizationId",
      label: "Organization",
      type: "select",
      required: true,
      options: (orgs.data?.data ?? []).map((o) => ({ value: o._id, label: o.name })),
    },
    {
      name: "routeId",
      label: "Route",
      type: "select",
      options: (routes.data?.data ?? []).map((r) => ({ value: r._id, label: `${r.code} · ${r.name} (${r.distanceKm} km)` })),
    },
    { name: "pickupPoint", label: "Pickup point", type: "text", required: true, placeholder: "Lake View Gate" },
    {
      name: "ratePerKm",
      label: "Rate per km (₹)",
      type: "number",
      required: true,
      min: 0,
      help: "Monthly fee = route distance × this rate.",
    },
    { name: "parent.name", label: "Parent name", type: "text" },
    { name: "parent.phone", label: "Parent phone", type: "tel" },
    { name: "parent.email", label: "Parent email", type: "email" },
    { name: "isActive", label: "Currently using transport", type: "checkbox" },
  ];

  return (
    <ResourcePage<StudentRecord>
      resource="students"
      title="Students"
      subtitle="Every student on transport, across all organizations."
      singular="student"
      rowKey={(s) => s._id}
      describe={(s) => `${s.name} (${s.studentCode})`}
      searchPlaceholder="Search name, ID, class or pickup…"
      emptyMessage="No students enrolled yet."
      canWrite
      fields={fields}
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
        { header: "Rate", cell: (s) => <span className="text-muted2">₹{s.ratePerKm}/km</span> },
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
  );
}
