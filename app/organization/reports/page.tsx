"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ReportsView } from "@/components/dashboard/ReportsView";

export default function OrgReportsPage() {
  return (
    <PortalShell role="org">
      <ReportsView subtitle="Your transport spend and outstanding balance. Scoped to your organization." />
    </PortalShell>
  );
}
