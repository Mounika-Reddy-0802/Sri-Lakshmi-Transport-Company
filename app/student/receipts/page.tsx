"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { PageHeader, Panel } from "@/components/dashboard/Shell";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import { api, type ListEnvelope, type StudentInvoice } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function StudentReceiptsPage() {
  return (
    <PortalShell role="student">
      <ReceiptsView />
    </PortalShell>
  );
}

function ReceiptsView() {
  const { user } = useAuth();
  const studentId = user?.studentId;

  const invoices = useQuery({
    queryKey: ["student", studentId, "invoices"],
    queryFn: () => api.get<ListEnvelope<StudentInvoice>>(`/students/${studentId}/invoices?limit=50`),
    enabled: Boolean(studentId),
  });

  const paid = (invoices.data?.data ?? []).filter((i) => i.status === "paid");
  const total = paid.reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <PageHeader
        title="Receipts"
        subtitle="Every settled payment, newest first."
      />

      <Panel
        title="Paid invoices"
        action={
          paid.length > 0 ? (
            <span className="text-xs text-muted2">
              {paid.length} payment{paid.length === 1 ? "" : "s"} · ₹{total.toLocaleString("en-IN")}
            </span>
          ) : undefined
        }
      >
        {invoices.isPending ? (
          <TableSkeleton rows={3} />
        ) : invoices.isError ? (
          <ErrorState message="Could not load your receipts." onRetry={() => void invoices.refetch()} />
        ) : paid.length === 0 ? (
          <EmptyState message="No payments yet. Receipts appear here once an invoice is paid." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted2">
                  <th className="pb-2 pr-4">Receipt for</th>
                  <th className="pb-2 pr-4">Period</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Paid on</th>
                  <th className="pb-2 text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {[...paid]
                  .sort((a, b) => b.period.localeCompare(a.period))
                  .map((inv) => (
                    <tr key={inv._id} className="border-t hairline">
                      <td className="py-3 pr-4 font-medium text-midnight dark:text-fog">{inv.id}</td>
                      <td className="py-3 pr-4 text-muted2">{inv.period}</td>
                      <td className="py-3 pr-4 text-muted2">₹{inv.amount.toLocaleString("en-IN")}</td>
                      <td className="py-3 pr-4 text-muted2">{inv.date}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/student/receipts/${inv._id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-xs font-medium text-midnight transition hover:bg-slate/10 dark:text-fog"
                        >
                          <Download size={13} /> View receipt
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
