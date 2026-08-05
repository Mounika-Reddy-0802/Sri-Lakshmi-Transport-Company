"use client";
// Searchable, paginated table shared by every resource page.
//
// Search is debounced and resets to page 1, because searching while on page 4
// of the old result set otherwise lands you on an empty page.
import { useEffect, useState, type ReactNode } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/States";
import type { ListEnvelope } from "@/lib/api";

export type Column<T> = {
  header: string;
  /** Cell renderer. Keep it presentational — no data fetching in here. */
  cell: (row: T) => ReactNode;
  className?: string;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  query: {
    data?: ListEnvelope<T>;
    isPending: boolean;
    isError: boolean;
    error?: unknown;
    refetch: () => unknown;
  };
  page: number;
  onPageChange: (page: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  rowKey: (row: T) => string;
  emptyMessage?: string;
  /** Write actions — omitted entirely for read-only roles. */
  onCreate?: () => void;
  createLabel?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  toolbar?: ReactNode;
};

export function DataTable<T>({
  columns,
  query,
  page,
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  rowKey,
  emptyMessage = "Nothing here yet.",
  onCreate,
  createLabel = "Add",
  onEdit,
  onDelete,
  toolbar,
}: DataTableProps<T>) {
  const [draft, setDraft] = useState(search ?? "");

  // Debounce so a request is not fired on every keystroke.
  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (draft !== search) onSearchChange(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, search, onSearchChange]);

  const envelope = query.data;
  const rows = envelope?.data ?? [];
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {onSearchChange && (
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted2"
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/20 dark:bg-[#1A1D24] dark:text-white"
            />
          </div>
        )}
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {envelope && (
            <span className="text-xs text-muted2">
              {envelope.total} record{envelope.total === 1 ? "" : "s"}
            </span>
          )}
          {onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-4 py-2 text-sm font-medium text-white transition hover:bg-steel"
            >
              <Plus size={15} /> {createLabel}
            </button>
          )}
        </div>
      </div>

      {query.isPending ? (
        <TableSkeleton rows={6} />
      ) : query.isError ? (
        <ErrorState
          message={query.error instanceof Error ? query.error.message : undefined}
          onRetry={() => void query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState message={search ? `No matches for “${search}”.` : emptyMessage} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted2">
                  {columns.map((c) => (
                    <th key={c.header} className={`pb-2 pr-4 ${c.className ?? ""}`}>
                      {c.header}
                    </th>
                  ))}
                  {hasActions && <th className="pb-2 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={rowKey(row)} className="border-t hairline align-top">
                    {columns.map((c) => (
                      <td key={c.header} className={`py-3 pr-4 ${c.className ?? ""}`}>
                        {c.cell(row)}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="py-3 text-right whitespace-nowrap">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            aria-label="Edit"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted2 transition hover:bg-slate/10 hover:text-midnight dark:hover:text-fog"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            aria-label="Delete"
                            className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted2 transition hover:bg-slate/10 hover:text-slate"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {envelope && envelope.pages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-muted2">
                Page {envelope.page} of {envelope.pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="rounded-full border hairline px-4 py-1.5 text-sm text-midnight transition hover:bg-slate/10 disabled:opacity-40 dark:text-fog"
                >
                  Previous
                </button>
                <button
                  disabled={page >= envelope.pages}
                  onClick={() => onPageChange(page + 1)}
                  className="rounded-full border hairline px-4 py-1.5 text-sm text-midnight transition hover:bg-slate/10 disabled:opacity-40 dark:text-fog"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Small coloured status pill, shared across resources. */
export function StatusPill({ value }: { value: string }) {
  const tone: Record<string, string> = {
    Active: "bg-steel/15 text-steel dark:text-mist",
    paid: "bg-steel/15 text-steel dark:text-mist",
    Maintenance: "bg-slate/15 text-slate",
    pending: "bg-slate/15 text-slate",
    open: "bg-slate/15 text-slate",
    Inactive: "bg-slate/25 text-midnight dark:text-fog",
    overdue: "bg-slate/25 text-midnight dark:text-fog",
    resolved: "bg-steel/15 text-steel dark:text-mist",
  };
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${tone[value] ?? "bg-slate/15 text-slate"}`}>
      {label}
    </span>
  );
}
