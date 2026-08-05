// Sidebar navigation, defined once per role.
//
// The Shell renders these as real links and derives the active item from the
// current pathname, so a page never has to declare "I am the active one".
import type { Role } from "./api";

export type NavItem = {
  label: string;
  href: string;
  /** Set when the destination needs a backend that is not built yet. */
  comingSoon?: string;
};

export const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: "Overview", href: "/admin" },
    { label: "Buses", href: "/admin/buses" },
    { label: "Drivers", href: "/admin/drivers" },
    { label: "Routes", href: "/admin/routes" },
    { label: "Organizations", href: "/admin/organizations" },
    { label: "Students", href: "/admin/students" },
    { label: "Payments", href: "/admin/payments" },
    { label: "Documents", href: "/admin/documents", comingSoon: "Phase 8" },
    { label: "Taxes & EMI", href: "/admin/taxes" },
    { label: "Reports", href: "/admin/reports" },
  ],
  org: [
    { label: "Overview", href: "/organization" },
    { label: "Buses", href: "/organization/buses" },
    { label: "Routes", href: "/organization/routes" },
    { label: "Students", href: "/organization/students" },
    { label: "Invoices", href: "/organization/invoices" },
    { label: "Documents", href: "/organization/documents", comingSoon: "Phase 8" },
    { label: "Reports", href: "/organization/reports" },
  ],
  student: [
    { label: "My Transport", href: "/student" },
    { label: "Fee & Payments", href: "/student/fees" },
    { label: "Receipts", href: "/student/receipts" },
    { label: "Notifications", href: "/student/notifications", comingSoon: "Phase 9" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Super Admin",
  org: "Organization",
  student: "Student / Parent",
};
