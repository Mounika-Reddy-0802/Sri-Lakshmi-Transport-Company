"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ComingSoon } from "@/components/dashboard/ResourcePage";

export default function AdminDocumentsPage() {
  return (
    <PortalShell role="admin">
      <ComingSoon
        title="Documents"
        phase="Phase 8"
        description="Vehicle, driver and organization paperwork in one place."
        planned={[
          "Upload RC, insurance, permit, fitness, PUC, licences and client agreements",
          "Signed upload URLs backed by Vercel Blob — no third-party storage vendor",
          "Expiry dates stored per document, feeding the Taxes & EMI reminders",
          "Versioning, so replacing a renewed policy keeps the history",
          "Tenant-scoped access — an organization only ever sees its own files",
        ]}
      />
    </PortalShell>
  );
}
