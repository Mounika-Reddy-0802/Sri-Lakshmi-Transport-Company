// Presentation helpers.
//
// These exist because the dashboards were built against lib/mock-data.ts, where
// figures are already display strings ("₹14.4L", "22 Jun 2026"). Formatting
// here keeps Phase 5 a pure data-source swap with no component changes.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-06" -> "Jun" */
export function monthLabel(period: string): string {
  const month = Number(period.slice(5, 7));
  return MONTHS[month - 1] ?? period;
}

/** Indian digit grouping: 246000 -> "2,46,000" */
export function groupInr(value: number): string {
  return Math.round(value).toLocaleString("en-IN");
}

/** 246000 -> "₹2,46,000" */
export function rupees(value: number): string {
  return `₹${groupInr(value)}`;
}

/** 1440000 -> "₹14.4L"; falls back to full grouping under a lakh. */
export function rupeesCompact(value: number): string {
  if (Math.abs(value) >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (Math.abs(value) >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  return rupees(value);
}

/** Date -> "22 Jun 2026" */
export function longDate(value: Date): string {
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${day} ${MONTHS[value.getUTCMonth()]} ${value.getUTCFullYear()}`;
}

/** Reminder type -> the label the admin alert panel shows. */
export const REMINDER_LABELS: Record<string, string> = {
  insurance: "Insurance",
  licence: "Driver Licence",
  emi: "EMI",
  tax: "Road Tax",
  fitness: "Fitness",
  permit: "Permit",
  puc: "PUC",
};
