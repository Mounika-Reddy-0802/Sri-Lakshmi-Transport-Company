"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import type { Field } from "@/components/dashboard/FormModal";
import type { OrganizationRecord } from "@/lib/resources";

const TYPES = ["School", "University", "Corporate", "Pharma", "Other"];

const fields: Field[] = [
  { name: "name", label: "Organization name", type: "text", required: true },
  {
    name: "type",
    label: "Type",
    type: "select",
    required: true,
    options: TYPES.map((t) => ({ value: t, label: t })),
  },
  { name: "location", label: "Location", type: "text", placeholder: "TSIIC, Jadcherla" },
  { name: "clientSince", label: "Client since", type: "text", placeholder: "2021 – Present" },
  { name: "contactName", label: "Contact person", type: "text" },
  { name: "contactEmail", label: "Contact email", type: "email" },
  { name: "contactPhone", label: "Contact phone", type: "tel" },
  { name: "gstNumber", label: "GST number", type: "text" },
  { name: "isActive", label: "Active client", type: "checkbox" },
];

export default function AdminOrganizationsPage() {
  return (
    <PortalShell role="admin">
      <ResourcePage<OrganizationRecord>
        resource="organizations"
        title="Organizations"
        subtitle="Schools, universities and corporates SLTC provides transport for."
        singular="organization"
        rowKey={(o) => o._id}
        describe={(o) => o.name}
        searchPlaceholder="Search name, location or type…"
        emptyMessage="No organizations yet."
        canWrite
        fields={fields}
        columns={[
          {
            header: "Organization",
            cell: (o) => (
              <div>
                <div className="font-medium text-midnight dark:text-fog">{o.name}</div>
                <div className="text-xs text-muted2">
                  {o.type}
                  {o.location ? ` · ${o.location}` : ""}
                </div>
              </div>
            ),
          },
          {
            header: "Contact",
            cell: (o) =>
              o.contactName || o.contactPhone ? (
                <div>
                  <div className="text-midnight dark:text-fog">{o.contactName ?? "—"}</div>
                  <div className="text-xs text-muted2">{o.contactPhone ?? o.contactEmail ?? ""}</div>
                </div>
              ) : (
                <span className="text-muted2">—</span>
              ),
          },
          { header: "Client since", cell: (o) => <span className="text-muted2">{o.clientSince ?? "—"}</span> },
          { header: "GST", cell: (o) => <span className="text-muted2">{o.gstNumber ?? "—"}</span> },
          { header: "Status", cell: (o) => <StatusPill value={o.isActive === false ? "Inactive" : "Active"} /> },
        ]}
      />
    </PortalShell>
  );
}
