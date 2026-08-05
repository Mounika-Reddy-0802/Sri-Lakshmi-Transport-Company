"use client";
// Guard + chrome for every portal page, so a page file only contains its
// own content.
import type { ReactNode } from "react";
import { Shell } from "./Shell";
import { RequireRole, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/api";

const FALLBACK_NAME: Record<Role, string> = {
  admin: "SLTC Operations",
  org: "Your organization",
  student: "Parent",
};

export function PortalShell({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <RequireRole roles={[role]}>
      <WithUser role={role}>{children}</WithUser>
    </RequireRole>
  );
}

function WithUser({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  return (
    <Shell role={role} user={user?.name ?? FALLBACK_NAME[role]}>
      {children}
    </Shell>
  );
}
