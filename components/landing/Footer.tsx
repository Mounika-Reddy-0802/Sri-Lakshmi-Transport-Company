import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { company } from "@/lib/mock-data";

export function Footer() {
  return (
    <footer className="border-t border-line bg-haze py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center">
        <Logo size={40} withName sub={company.tagline} />
        <div className="flex flex-col gap-1 text-sm text-muted2 sm:items-end">
          <span>{company.phones.join("  ·  ")}</span>
          <span>{company.emails[0]}</span>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-xs text-muted2">
        <span>© {new Date().getFullYear()} {company.name} · Incorporated {company.incorporated}</span>
        <span className="flex gap-5">
          <Link href="/login" className="hover:text-ink dark:hover:text-white">Admin</Link>
          <Link href="/login" className="hover:text-ink dark:hover:text-white">Organizations</Link>
          <Link href="/login" className="hover:text-ink dark:hover:text-white">Students</Link>
        </span>
      </div>
    </footer>
  );
}
