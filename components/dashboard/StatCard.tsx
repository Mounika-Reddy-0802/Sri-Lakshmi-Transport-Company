import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({ label, value, delta, tone }: { label: string; value: string; delta?: string; tone?: string }) {
  const up = tone !== "down";
  return (
    <div className="surface rounded-xl2 p-5">
      <div className="text-sm text-muted2">{label}</div>
      <div className="display mt-2 text-2xl text-navy dark:text-white">{value}</div>
      {delta && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs ${up ? "text-green" : "text-muted2"}`}>
          {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{delta}
        </div>
      )}
    </div>
  );
}
