"use client";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ComingSoon } from "@/components/dashboard/ResourcePage";

export default function StudentNotificationsPage() {
  return (
    <PortalShell role="student">
      <ComingSoon
        title="Notifications"
        phase="Phase 9"
        description="Fee reminders and route updates, delivered rather than waited for."
        planned={[
          "Email, SMS and WhatsApp reminders before a fee falls due",
          "Alerts when your route, pickup point or bus changes",
          "Driver change notices for the vehicle your child travels on",
          "A scheduled job scans what is due and logs every message sent",
        ]}
      />
    </PortalShell>
  );
}
