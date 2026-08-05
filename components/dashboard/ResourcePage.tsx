"use client";
// Full CRUD screen for one collection.
//
// Pages supply columns and form fields; everything else — paging, debounced
// search, create/edit/delete wiring, cache invalidation — lives here so the
// nine resource pages stay declarative and behave identically.
import { useState, type ReactNode } from "react";
import { PageHeader } from "./Shell";
import { DataTable, type Column } from "./DataTable";
import { ConfirmDialog, FormModal, type Field } from "./FormModal";
import {
  useCreateResource,
  useDeleteResource,
  useResourceList,
  useUpdateResource,
} from "@/lib/resources";

export type ResourcePageProps<T> = {
  /** API path segment, e.g. "buses". */
  resource: string;
  title: string;
  subtitle?: string;
  /** Used in button and dialog copy: "Add bus", "Delete bus?". */
  singular: string;
  columns: Column<T>[];
  /** Omit to make the page read-only (org and student roles). */
  fields?: Field[];
  canWrite?: boolean;
  rowKey: (row: T) => string;
  /** Text shown in the delete confirmation, e.g. row.regNumber. */
  describe?: (row: T) => string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  filters?: Record<string, string | undefined>;
  toolbar?: ReactNode;
  headerAction?: ReactNode;
};

export function ResourcePage<T>({
  resource,
  title,
  subtitle,
  singular,
  columns,
  fields,
  canWrite = false,
  rowKey,
  describe,
  searchPlaceholder,
  emptyMessage,
  filters,
  toolbar,
  headerAction,
}: ResourcePageProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const list = useResourceList<T>(resource, { page, limit: 20, q: search, filters });
  const create = useCreateResource(resource);
  const update = useUpdateResource(resource);
  const remove = useDeleteResource(resource);

  const writable = canWrite && Boolean(fields);

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} action={headerAction} />

      <div className="surface rounded-xl2 p-5 sm:p-6">
        <DataTable<T>
          columns={columns}
          query={list}
          page={page}
          onPageChange={setPage}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder={searchPlaceholder}
          rowKey={rowKey}
          emptyMessage={emptyMessage}
          toolbar={toolbar}
          onCreate={writable ? () => setCreating(true) : undefined}
          createLabel={`Add ${singular}`}
          onEdit={writable ? (row) => setEditing(row) : undefined}
          onDelete={writable ? (row) => setDeleting(row) : undefined}
        />
      </div>

      {creating && fields && (
        <FormModal
          title={`Add ${singular}`}
          fields={fields}
          submitLabel={`Create ${singular}`}
          onSubmit={(payload) => create.mutateAsync(payload)}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && fields && (
        <FormModal
          title={`Edit ${singular}`}
          fields={fields}
          record={editing as Record<string, unknown>}
          onSubmit={(payload) =>
            update.mutateAsync({ id: rowKey(editing), body: payload })
          }
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${singular}?`}
          message={`${describe ? describe(deleting) : "This record"} will be permanently removed. This cannot be undone.`}
          onConfirm={() => remove.mutateAsync(rowKey(deleting))}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}

/** Honest placeholder for nav items whose backend is not built yet. */
export function ComingSoon({
  title,
  phase,
  description,
  planned,
}: {
  title: string;
  phase: string;
  description: string;
  planned: string[];
}) {
  return (
    <>
      <PageHeader title={title} subtitle={description} />
      <div className="surface rounded-xl2 p-8">
        <span className="inline-block rounded-full bg-steel/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-steel dark:text-mist">
          {phase}
        </span>
        <p className="mt-4 max-w-lg text-sm text-muted2">
          This screen is not built yet — it needs backend work that is scheduled for {phase} of the
          build plan. It is listed here so the navigation reflects the real product, rather than
          hiding what is still to come.
        </p>
        <ul className="mt-5 space-y-2">
          {planned.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-midnight dark:text-fog">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mist" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
