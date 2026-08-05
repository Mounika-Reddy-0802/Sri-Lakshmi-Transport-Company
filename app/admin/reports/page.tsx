"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ReportsView } from "@/components/dashboard/ReportsView";

export default function AdminReportsPage() {
  return (
    <PortalShell role="admin">
      <ReportsView subtitle="Billing and collection across every organization SLTC serves." />
    </PortalShell>
  );
}
