"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { useLogout } from "@/lib/auth";
import { NAV, ROLE_LABEL } from "@/lib/nav";
import type { Role } from "@/lib/api";

export function Shell({
  role,
  user,
  children,
}: {
  role: Role;
  user: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const pathname = usePathname();
  const nav = NAV[role];

  // The most specific matching href wins, so /admin does not stay highlighted
  // while you are on /admin/buses.
  const activeHref = nav
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className="min-h-screen bg-fog dark:bg-[#0f1820]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r hairline bg-white p-5 transition-transform dark:bg-midnight md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2.5">
          <Logo size={36} />
          <div>
            <div className="display text-ink dark:text-white">SLTC</div>
            <div className="text-[11px] uppercase tracking-wide text-muted2">{ROLE_LABEL[role]}</div>
          </div>
        </div>

        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-steel/12 font-medium text-steel dark:text-mist"
                    : "text-muted2 hover:bg-slate/10"
                }`}
              >
                <span>{item.label}</span>
                {item.comingSoon && (
                  <span className="rounded-full bg-slate/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted2">
                    soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => void logout()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted2 hover:bg-slate/10"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b hairline bg-white/80 px-5 py-3.5 backdrop-blur dark:bg-midnight/80">
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden text-sm text-muted2 md:block">
            Welcome back, <span className="font-medium text-midnight dark:text-fog">{user}</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-steel/15 text-sm font-medium text-steel dark:text-mist">
              {user
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="surface rounded-xl2 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="display text-base text-midnight dark:text-fog">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Page heading used by every sub-page. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="display text-2xl text-midnight dark:text-fog">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
