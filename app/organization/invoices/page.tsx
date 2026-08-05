"use client";
import { useState } from "react";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import { refName, type InvoiceRecord } from "@/lib/resources";

const STATUSES = ["paid", "pending", "overdue"];

export default function OrgInvoicesPage() {
  return (
    <PortalShell role="org">
      <InvoicesView />
    </PortalShell>
  );
}

function InvoicesView() {
  const [status, setStatus] = useState("");

  return (
    <ResourcePage<InvoiceRecord>
      resource="invoices"
      title="Invoices"
      subtitle="Transport billing for your organization."
      singular="invoice"
      rowKey={(i) => i._id}
      searchPlaceholder="Search invoice number or period…"
      emptyMessage="No invoices have been raised for your organization yet."
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
            <span className="font-medium text-midnight dark:text-fog">₹{i.amount.toLocaleString("en-IN")}</span>
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
        { header: "Status", cell: (i) => <StatusPill value={i.status} /> },
      ]}
    />
  );
}
