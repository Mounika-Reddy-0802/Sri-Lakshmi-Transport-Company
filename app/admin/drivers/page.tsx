"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import type { Field } from "@/components/dashboard/FormModal";
import { useOptions, type DriverRecord, type OrganizationRecord } from "@/lib/resources";

function licenceCell(value: string) {
  const date = new Date(value);
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  const label = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  // A driver with an expired licence must not be on the road — make it loud.
  if (days < 0) return <span className="font-medium text-slate">{label} · expired</span>;
  if (days <= 45) return <span className="font-medium text-slate">{label} · {days}d left</span>;
  return <span className="text-muted2">{label}</span>;
}

export default function AdminDriversPage() {
  return (
    <PortalShell role="admin">
      <DriversView />
    </PortalShell>
  );
}

function DriversView() {
  const orgs = useOptions<OrganizationRecord>("organizations");

  const fields: Field[] = [
    { name: "name", label: "Full name", type: "text", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "+91 90000 00000" },
    { name: "licenceNumber", label: "Licence number", type: "text", required: true },
    { name: "licenceExpiry", label: "Licence expiry", type: "date", required: true },
    {
      name: "organizationId",
      label: "Assigned organization",
      type: "select",
      options: (orgs.data?.data ?? []).map((o) => ({ value: o._id, label: o.name })),
      help: "Leave empty for drivers on the general pool.",
    },
    { name: "aadhaar", label: "Aadhaar (optional)", type: "text", help: "Stored for compliance; never shown to clients." },
    { name: "isActive", label: "Currently employed", type: "checkbox" },
  ];

  return (
    <ResourcePage<DriverRecord>
      resource="drivers"
      title="Drivers"
      subtitle="Licences and contact details. Expiries within 45 days are highlighted."
      singular="driver"
      rowKey={(d) => d._id}
      describe={(d) => d.name}
      searchPlaceholder="Search name, phone or licence…"
      emptyMessage="No drivers have been added yet."
      canWrite
      fields={fields}
      columns={[
        {
          header: "Driver",
          cell: (d) => (
            <div>
              <div className="font-medium text-midnight dark:text-fog">{d.name}</div>
              <div className="text-xs text-muted2">{d.phone}</div>
            </div>
          ),
        },
        { header: "Licence", cell: (d) => <span className="text-muted2">{d.licenceNumber}</span> },
        { header: "Expires", cell: (d) => licenceCell(d.licenceExpiry) },
        { header: "Status", cell: (d) => <StatusPill value={d.isActive === false ? "Inactive" : "Active"} /> },
      ]}
    />
  );
}
