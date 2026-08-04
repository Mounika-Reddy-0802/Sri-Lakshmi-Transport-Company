export function Eyebrow({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "muted" }) {
  const c = tone === "green" ? "text-green" : tone === "muted" ? "text-muted2" : "text-blue";
  return <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${c}`}>{children}</span>;
}
