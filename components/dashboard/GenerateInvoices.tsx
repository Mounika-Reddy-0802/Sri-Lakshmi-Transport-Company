"use client";
// Raises a whole month's invoices in one action.
//
// Always offers a dry run first — this writes one row per active student, and
// seeing the number and the total before committing is worth the extra click.
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import { useOptions, type OrganizationRecord } from "@/lib/resources";

type GenerateResult = {
  period: string;
  dryRun?: boolean;
  candidates: number;
  created: number;
  wouldCreate?: number;
  skipped: number;
  totalAmount: number;
  skippedDetail: { student: string; studentCode: string; reason: string }[];
};

/** Current month as YYYY-MM. */
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function GenerateInvoices({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const orgs = useOptions<OrganizationRecord>("organizations");

  const [period, setPeriod] = useState(currentPeriod());
  const [organizationId, setOrganizationId] = useState("");
  const [dueDay, setDueDay] = useState(5);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useMutation({
    mutationFn: (dryRun: boolean) =>
      api.post<GenerateResult>("/invoices/generate", {
        period,
        dueDay,
        dryRun,
        ...(organizationId ? { organizationId } : {}),
      }),
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      if (!data.dryRun) queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not generate invoices.");
      setResult(null);
    },
  });

  const previewed = result?.dryRun === true;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-5" onClick={onClose}>
      <div className="surface my-8 w-full max-w-lg rounded-xl2 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="display text-lg text-midnight dark:text-fog">Generate monthly invoices</h2>
          <button onClick={onClose} className="text-muted2" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="mt-2 text-sm text-muted2">
          Raises one invoice per active student with a route, priced at route distance × rate per km.
          Students already invoiced for the period are skipped, so this is safe to re-run.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gi-period" className="block text-sm font-medium text-ink dark:text-white">
              Billing period <span className="text-slate">*</span>
            </label>
            <input
              id="gi-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-08"
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-steel focus:ring-2 focus:ring-steel/20 dark:bg-[#1A1D24] dark:text-white"
            />
            <p className="mt-1 text-xs text-muted2">Format YYYY-MM.</p>
          </div>

          <div>
            <label htmlFor="gi-due" className="block text-sm font-medium text-ink dark:text-white">
              Due on day
            </label>
            <input
              id="gi-due"
              type="number"
              min={1}
              max={28}
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-steel focus:ring-2 focus:ring-steel/20 dark:bg-[#1A1D24] dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="gi-org" className="block text-sm font-medium text-ink dark:text-white">
              Organization
            </label>
            <select
              id="gi-org"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-steel dark:bg-[#1A1D24] dark:text-white"
            >
              <option value="">All organizations</option>
              {(orgs.data?.data ?? []).map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-slate/10 px-4 py-3 text-sm text-midnight dark:text-fog">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-5 rounded-lg border hairline p-4">
            <p className="text-sm font-medium text-midnight dark:text-fog">
              {result.dryRun
                ? `Preview — would raise ${result.wouldCreate} invoice${result.wouldCreate === 1 ? "" : "s"}`
                : `Raised ${result.created} invoice${result.created === 1 ? "" : "s"}`}{" "}
              for {result.period}
            </p>
            <p className="mt-1 text-sm text-muted2">
              {result.candidates} student{result.candidates === 1 ? "" : "s"} considered ·{" "}
              {result.skipped} skipped · total ₹{result.totalAmount.toLocaleString("en-IN")}
            </p>

            {result.skippedDetail.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted2">
                  Why {result.skipped} were skipped
                </summary>
                <ul className="mt-2 space-y-1">
                  {result.skippedDetail.slice(0, 20).map((s) => (
                    <li key={s.studentCode} className="text-xs text-muted2">
                      {s.student} ({s.studentCode}) — {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border hairline px-5 py-2.5 text-sm text-midnight transition hover:bg-slate/10 dark:text-fog"
          >
            Close
          </button>
          <button
            onClick={() => run.mutate(true)}
            disabled={run.isPending}
            className="rounded-full border hairline px-5 py-2.5 text-sm text-midnight transition hover:bg-slate/10 disabled:opacity-60 dark:text-fog"
          >
            Preview
          </button>
          <button
            onClick={() => run.mutate(false)}
            disabled={run.isPending || !previewed}
            title={previewed ? undefined : "Run a preview first"}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-sm font-medium text-white transition hover:bg-steel disabled:opacity-60"
          >
            {run.isPending && <Loader2 size={15} className="animate-spin" />}
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
