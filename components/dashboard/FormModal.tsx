"use client";
// Config-driven create/edit form.
//
// Each resource page declares its fields; this renders them, coerces values to
// the types the Zod schemas on the server expect, and surfaces the API's
// validation details inline rather than as one opaque message.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api";

export type FieldType = "text" | "number" | "email" | "tel" | "date" | "select" | "checkbox";

export type SelectOption = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: SelectOption[];
  /** Rendered full width instead of in the two-column grid. */
  wide?: boolean;
  min?: number;
  max?: number;
  step?: number;
};

type Values = Record<string, string | number | boolean | undefined>;

/** Reads "insurance.expiryDate" out of a nested record. */
function readPath(source: Record<string, unknown> | undefined, path: string): unknown {
  if (!source) return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

/** Writes "insurance.expiryDate" into a nested payload. */
function writePath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let cursor = target;
  keys.slice(0, -1).forEach((key) => {
    if (typeof cursor[key] !== "object" || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key] as Record<string, unknown>;
  });
  cursor[keys[keys.length - 1] as string] = value;
}

/** A populated ref arrives as an object; the form needs its id. */
function initialValue(record: Record<string, unknown> | undefined, field: Field): Values[string] {
  const raw = readPath(record, field.name);
  if (raw === null || raw === undefined) return field.type === "checkbox" ? false : "";

  if (field.type === "checkbox") return Boolean(raw);
  if (field.type === "date") return String(raw).slice(0, 10);
  if (field.type === "select" && typeof raw === "object" && "_id" in raw) {
    return String((raw as { _id: unknown })._id);
  }
  if (field.type === "number") return typeof raw === "number" ? raw : Number(raw);
  return String(raw);
}

export function FormModal({
  title,
  fields,
  record,
  submitLabel = "Save",
  onSubmit,
  onClose,
}: {
  title: string;
  fields: Field[];
  /** Present when editing; absent when creating. */
  record?: Record<string, unknown>;
  submitLabel?: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<unknown>;
  onClose: () => void;
}) {
  const initial = useMemo(() => {
    const values: Values = {};
    fields.forEach((f) => {
      values[f.name] = initialValue(record, f);
    });
    return values;
  }, [fields, record]);

  const [values, setValues] = useState<Values>(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(initial), [initial]);

  // Escape closes, matching the click-outside behaviour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      const value = values[field.name];

      if (field.type === "checkbox") {
        writePath(payload, field.name, Boolean(value));
        return;
      }
      // Empty optional fields are omitted rather than sent as "", which the
      // server's Zod schemas would reject for emails, urls and ObjectIds.
      if (value === "" || value === undefined) return;

      if (field.type === "number") {
        const numeric = Number(value);
        if (!Number.isNaN(numeric)) writePath(payload, field.name, numeric);
        return;
      }
      writePath(payload, field.name, value);
    });
    return payload;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      await onSubmit(buildPayload());
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        // The API returns details as [{ path, message }] for validation errors.
        if (Array.isArray(err.details)) {
          const mapped: Record<string, string> = {};
          for (const detail of err.details as { path?: string; message?: string }[]) {
            if (detail.path) mapped[detail.path] = detail.message ?? "Invalid value";
          }
          setFieldErrors(mapped);
        }
      } else {
        setError("Could not save. Is the API running?");
      }
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-5" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="surface my-8 w-full max-w-xl rounded-xl2 p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="display text-lg text-midnight dark:text-fog">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted2" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const id = `f-${field.name.replace(/\./g, "-")}`;
            const fieldError = fieldErrors[field.name];
            const base =
              "mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:ring-2 focus:ring-steel/20 dark:bg-[#1A1D24] dark:text-white";
            const border = fieldError ? "border-slate" : "border-line focus:border-steel";

            return (
              <div key={field.name} className={field.wide || field.type === "checkbox" ? "sm:col-span-2" : ""}>
                {field.type === "checkbox" ? (
                  <label htmlFor={id} className="flex items-center gap-2.5 text-sm text-ink dark:text-white">
                    <input
                      id={id}
                      type="checkbox"
                      checked={Boolean(values[field.name])}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.checked }))}
                      className="h-4 w-4 rounded border-line accent-steel"
                    />
                    {field.label}
                  </label>
                ) : (
                  <>
                    <label htmlFor={id} className="block text-sm font-medium text-ink dark:text-white">
                      {field.label}
                      {field.required && <span className="text-slate"> *</span>}
                    </label>

                    {field.type === "select" ? (
                      <select
                        id={id}
                        required={field.required}
                        value={String(values[field.name] ?? "")}
                        onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                        className={`${base} ${border}`}
                      >
                        <option value="">
                          {field.required ? "Select…" : "— none —"}
                        </option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={id}
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={String(values[field.name] ?? "")}
                        onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                        className={`${base} ${border}`}
                      />
                    )}
                  </>
                )}

                {fieldError ? (
                  <p className="mt-1 text-xs text-slate">{fieldError}</p>
                ) : field.help ? (
                  <p className="mt-1 text-xs text-muted2">{field.help}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-slate/10 px-4 py-3 text-sm text-midnight dark:text-fog">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border hairline px-5 py-2.5 text-sm text-midnight transition hover:bg-slate/10 dark:text-fog"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-sm font-medium text-white transition hover:bg-steel disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" onClick={onClose}>
      <div className="surface w-full max-w-sm rounded-xl2 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="display text-lg text-midnight dark:text-fog">{title}</h2>
        <p className="mt-2 text-sm text-muted2">{message}</p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-slate/10 px-4 py-3 text-sm text-midnight dark:text-fog">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border hairline px-5 py-2.5 text-sm text-midnight transition hover:bg-slate/10 dark:text-fog"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm();
                onClose();
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "Could not delete.");
                setBusy(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-slate px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
