"use client";
import { useState } from "react";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import type { Field } from "@/components/dashboard/FormModal";
import {
  refName,
  useOptions,
  type InvoiceRecord,
  type OrganizationRecord,
  type StudentRecord,
} from "@/lib/resources";

const STATUSES = ["paid", "pending", "overdue"];

export default function AdminPaymentsPage() {
  return (
    <PortalShell role="admin">
      <PaymentsView />
    </PortalShell>
  );
}

function PaymentsView() {
  const [status, setStatus] = useState("");
  const orgs = useOptions<OrganizationRecord>("organizations");
  const students = useOptions<StudentRecord>("students");

  const fields: Field[] = [
    { name: "invoiceNumber", label: "Invoice number", type: "text", required: true, placeholder: "INV-202607-SV-1042" },
    {
      name: "studentId",
      label: "Student",
      type: "select",
      required: true,
      options: (students.data?.data ?? []).map((s) => ({ value: s._id, label: `${s.name} (${s.studentCode})` })),
    },
    {
      name: "organizationId",
      label: "Organization",
      type: "select",
      required: true,
      options: (orgs.data?.data ?? []).map((o) => ({ value: o._id, label: o.name })),
      help: "Kept on the invoice so billing queries stay tenant-scoped.",
    },
    { name: "period", label: "Billing period", type: "text", required: true, placeholder: "2026-07", help: "Format YYYY-MM." },
    { name: "amount", label: "Amount (₹)", type: "number", required: true, min: 0 },
    { name: "dueDate", label: "Due date", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
      help: "Paid is normally set by the Razorpay flow, not by hand.",
    },
  ];

  return (
    <ResourcePage<InvoiceRecord>
      resource="invoices"
      title="Payments"
      subtitle="Every invoice raised, across all organizations."
      singular="invoice"
      rowKey={(i) => i._id}
      describe={(i) => `Invoice ${i.invoiceNumber}`}
      searchPlaceholder="Search invoice number or period…"
      emptyMessage="No invoices have been raised yet."
      canWrite
      fields={fields}
      filters={{ status: status || undefined }}
      toolbar={
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel dark:bg-[#1A1D24] dark:text-white"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      }
      columns={[
        {
          header: "Invoice",
          cell: (i) => (
            <div>
              <div className="font-medium text-midnight dark:text-fog">{i.invoiceNumber}</div>
              <div className="text-xs text-muted2">{i.period}</div>
            </div>
          ),
        },
        { header: "Student", cell: (i) => <span className="text-muted2">{refName(i.studentId)}</span> },
        {
          header: "Amount",
          cell: (i) => (
            <span className="font-medium text-midnight dark:text-fog">
              ₹{i.amount.toLocaleString("en-IN")}
            </span>
          ),
        },
        {
          header: "Due",
          cell: (i) => (
            <span className="text-muted2">
              {new Date(i.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          ),
        },
        {
          header: "Paid on",
          cell: (i) =>
            i.paidAt ? (
              <span className="text-muted2">
                {new Date(i.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            ) : (
              <span className="text-muted2">—</span>
            ),
        },
        { header: "Status", cell: (i) => <StatusPill value={i.status} /> },
      ]}
    />
  );
}
