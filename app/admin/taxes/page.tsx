"use client";
import { useState } from "react";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import type { Field } from "@/components/dashboard/FormModal";
import type { ReminderRecord } from "@/lib/resources";

// The Reminder collection backs both this screen and the alert panel on the
// admin overview — road tax, EMI, insurance, licence, fitness, permit and PUC.
const TYPES = [
  { value: "emi", label: "Vehicle loan EMI" },
  { value: "tax", label: "Road tax" },
  { value: "insurance", label: "Insurance" },
  { value: "licence", label: "Driver licence" },
  { value: "fitness", label: "Fitness certificate" },
  { value: "permit", label: "Permit" },
  { value: "puc", label: "PUC" },
];

const STATUSES = ["open", "resolved", "dismissed"];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.value, t.label]));

const fields: Field[] = [
  { name: "type", label: "Type", type: "select", required: true, options: TYPES },
  { name: "title", label: "Title", type: "text", required: true, placeholder: "Quarterly road tax — 7 vehicles" },
  { name: "detail", label: "Detail", type: "text", wide: true },
  { name: "dueDate", label: "Due date", type: "date", required: true },
  { name: "amount", label: "Amount (₹)", type: "number", min: 0, help: "Leave blank for non-financial renewals." },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
  },
];

function dueCell(value: string) {
  const date = new Date(value);
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);
  const label = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (days < 0) return <span className="font-medium text-slate">{label} · overdue</span>;
  if (days <= 30) return <span className="font-medium text-slate">{label} · in {days}d</span>;
  return <span className="text-muted2">{label}</span>;
}

export default function AdminTaxesPage() {
  return (
    <PortalShell role="admin">
      <TaxesView />
    </PortalShell>
  );
}

function TaxesView() {
  const [type, setType] = useState("");

  return (
    <ResourcePage<ReminderRecord>
      resource="reminders"
      title="Taxes & EMI"
      subtitle="Statutory renewals and loan instalments. These feed the alert panel on your overview."
      singular="reminder"
      rowKey={(r) => r._id}
      describe={(r) => r.title}
      searchPlaceholder="Search title or detail…"
      emptyMessage="Nothing outstanding. All renewals are current."
      canWrite
      fields={fields}
      filters={{ type: type || undefined }}
      toolbar={
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by type"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel dark:bg-[#1A1D24] dark:text-white"
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      }
      columns={[
        {
          header: "Item",
          cell: (r) => (
            <div>
              <div className="font-medium text-midnight dark:text-fog">{r.title}</div>
              {r.detail && <div className="text-xs text-muted2">{r.detail}</div>}
            </div>
          ),
        },
        {
          header: "Type",
          cell: (r) => (
            <span className="text-xs font-medium uppercase tracking-wide text-steel dark:text-mist">
              {TYPE_LABEL[r.type] ?? r.type}
            </span>
          ),
        },
        { header: "Due", cell: (r) => dueCell(r.dueDate) },
        {
          header: "Amount",
          cell: (r) =>
            r.amount ? (
              <span className="font-medium text-midnight dark:text-fog">
                ₹{r.amount.toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="text-muted2">—</span>
            ),
        },
        { header: "Status", cell: (r) => <StatusPill value={r.status} /> },
      ]}
    />
  );
}
