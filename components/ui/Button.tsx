"use client";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "cta" | "ghost" | "outline";
  onClick?: () => void;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const variants: Record<string, string> = {
  cta: "bg-amber text-navy hover:bg-amberdark focus-visible:ring-amber shadow-soft",
  primary: "bg-navy text-white hover:bg-[#21242E] focus-visible:ring-navy",
  outline: "border border-line text-navy hover:bg-haze focus-visible:ring-navy dark:text-white dark:border-white/15 dark:hover:bg-white/5",
  ghost: "text-navy hover:bg-haze dark:text-white dark:hover:bg-white/5",
};

export function Button({ children, href, variant = "primary", onClick, className = "" }: Props) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}
