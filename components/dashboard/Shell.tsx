"use client";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { useLogout } from "@/lib/auth";

export type NavItem = { label: string; active?: boolean };

export function Shell({
  role, user, nav, children,
}: { role: string; user: string; nav: NavItem[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  return (
    <div className="min-h-screen bg-fog dark:bg-[#0f1820]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r hairline bg-white p-5 transition-transform dark:bg-midnight md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5">
          <Logo size={36} />
          <div>
            <div className="display text-ink dark:text-white">SLTC</div>
            <div className="text-[11px] uppercase tracking-wide text-muted2">{role}</div>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((n) => (
            <span key={n.label}
              className={`block cursor-pointer rounded-lg px-3 py-2.5 text-sm transition ${n.active ? "bg-steel/12 font-medium text-steel dark:text-mist" : "text-muted2 hover:bg-slate/10"}`}>
              {n.label}
            </span>
          ))}
        </nav>
        <button
          onClick={() => void logout()}
          className="absolute bottom-5 left-5 right-5 inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted2 hover:bg-slate/10"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b hairline bg-white/80 px-5 py-3.5 backdrop-blur dark:bg-midnight/80">
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden text-sm text-muted2 md:block">Welcome back, <span className="font-medium text-midnight dark:text-fog">{user}</span></div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-steel/15 text-sm font-medium text-steel dark:text-mist">
              {user.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </span>
          </div>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="surface rounded-xl2 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="display text-base text-midnight dark:text-fog">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
