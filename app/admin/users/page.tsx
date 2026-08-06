"use client";
import { useState } from "react";
import { PortalShell } from "@/components/dashboard/PortalShell";
import { ResourcePage } from "@/components/dashboard/ResourcePage";
import { StatusPill } from "@/components/dashboard/DataTable";
import type { Field } from "@/components/dashboard/FormModal";
import {
  useOptions,
  type OrganizationRecord,
  type StudentRecord,
  type UserRecord,
} from "@/lib/resources";

const ROLE_LABEL: Record<string, string> = {
  admin: "Super Admin",
  org: "Organization",
  student: "Student / Parent",
};

export default function AdminUsersPage() {
  return (
    <PortalShell role="admin">
      <UsersView />
    </PortalShell>
  );
}

function UsersView() {
  const [role, setRole] = useState("");
  const orgs = useOptions<OrganizationRecord>("organizations");
  const students = useOptions<StudentRecord>("students");

  const fields: Field[] = [
    { name: "name", label: "Full name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true, help: "This is the sign-in username." },
    {
      name: "password",
      label: "Password",
      type: "text",
      wide: true,
      help: "At least 8 characters. Required when creating; leave blank when editing to keep the current password. Changing it signs the account out everywhere.",
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      required: true,
      options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })),
      help: "Super Admins see everything. Organization and Parent accounts are scoped.",
    },
    {
      name: "organizationId",
      label: "Organization",
      type: "select",
      options: (orgs.data?.data ?? []).map((o) => ({ value: o._id, label: o.name })),
      help: "Required for Organization and Parent roles; must be empty for a Super Admin.",
    },
    {
      name: "studentId",
      label: "Linked student",
      type: "select",
      options: (students.data?.data ?? []).map((s) => ({
        value: s._id,
        label: `${s.name} (${s.studentCode})`,
      })),
      help: "Parent accounts only — the child whose transport they can see.",
    },
    { name: "isActive", label: "Account active", type: "checkbox" },
  ];

  return (
    <ResourcePage<UserRecord>
      resource="users"
      title="Users"
      subtitle="Sign-in accounts. This is how a new client gets access to their portal."
      singular="user"
      rowKey={(u) => u._id}
      describe={(u) => `${u.name} (${u.email})`}
      searchPlaceholder="Search name or email…"
      emptyMessage="No accounts yet."
      canWrite
      fields={fields}
      filters={{ role: role || undefined }}
      toolbar={
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filter by role"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-steel dark:bg-[#1A1D24] dark:text-white"
        >
          <option value="">All roles</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      }
      columns={[
        {
          header: "User",
          cell: (u) => (
            <div>
              <div className="font-medium text-midnight dark:text-fog">{u.name}</div>
              <div className="text-xs text-muted2">{u.email}</div>
            </div>
          ),
        },
        {
          header: "Role",
          cell: (u) => (
            <span className="text-xs font-medium uppercase tracking-wide text-steel dark:text-mist">
              {ROLE_LABEL[u.role] ?? u.role}
            </span>
          ),
        },
        {
          header: "Scope",
          cell: (u) => (
            <span className="text-muted2">
              {u.role === "admin" ? "All organizations" : (u.organizationName ?? "—")}
            </span>
          ),
        },
        {
          header: "Last sign-in",
          cell: (u) =>
            u.lastLoginAt ? (
              <span className="text-muted2">
                {new Date(u.lastLoginAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            ) : (
              <span className="text-muted2">never</span>
            ),
        },
        { header: "Status", cell: (u) => <StatusPill value={u.isActive ? "Active" : "Inactive"} /> },
      ]}
    />
  );
}
