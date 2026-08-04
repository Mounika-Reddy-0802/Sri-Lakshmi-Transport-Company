/* eslint-disable @next/next/no-img-element */
export function Logo({ size = 36, withName = false, sub }: { size?: number; withName?: boolean; sub?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="grid place-items-center overflow-hidden rounded-full bg-white ring-1 ring-line"
        style={{ width: size, height: size }}
      >
        <img src="/logo.png" alt="SLTC logo" className="h-full w-full object-contain p-0.5" />
      </span>
      {withName && (
        <span className="leading-tight">
          <span className="display block text-ink dark:text-white">SLTC</span>
          {sub && <span className="block text-[11px] uppercase tracking-[0.14em] text-muted2">{sub}</span>}
        </span>
      )}
    </span>
  );
}
