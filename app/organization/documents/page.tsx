"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ComingSoon } from "@/components/dashboard/ResourcePage";

export default function OrgDocumentsPage() {
  return (
    <PortalShell role="org">
      <ComingSoon
        title="Documents"
        phase="Phase 8"
        description="Your service agreement and the paperwork for vehicles on your routes."
        planned={[
          "Download your transport agreement and monthly invoices as PDF",
          "See insurance, permit, fitness and PUC status for the buses on your routes",
          "Expiry warnings before a vehicle's documents lapse",
          "Only ever your own organization's files",
        ]}
      />
    </PortalShell>
  );
}
