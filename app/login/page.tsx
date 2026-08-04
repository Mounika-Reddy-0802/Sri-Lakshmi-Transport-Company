"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Building2, GraduationCap, ArrowRight, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

const portals = [
  { href: "/admin", icon: ShieldCheck, title: "Admin Portal", who: "SLTC Staff", desc: "Full control of fleet, organizations, finance and compliance." },
  { href: "/organization", icon: Building2, title: "Organization Portal", who: "Schools & Corporates", desc: "Your buses, routes, students and billing in one place." },
  { href: "/student", icon: GraduationCap, title: "Student / Parent Portal", who: "Families", desc: "Route, pickup, driver details and monthly fee payment." },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-10 dark:bg-[#15171D]">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted2 hover:text-midnight dark:hover:text-fog">
          <ArrowLeft size={16} /> Back to site
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto mt-16 max-w-5xl text-center">
        <div className="mb-6 flex justify-center"><Logo size={52} /></div>
        <h1 className="display text-4xl text-ink dark:text-white">Choose your portal</h1>
        <p className="mt-3 text-muted2">Three roles, three dedicated dashboards. Pick one to open the demo.</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
        {portals.map((p, i) => (
          <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Link href={p.href} className="group block h-full rounded-xl2 border border-line bg-white p-7 transition-all hover:-translate-y-1 hover:border-ink/30 dark:bg-[#1A1D24]">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-haze text-ink dark:bg-white/10 dark:text-white">
                <p.icon size={22} />
              </span>
              <div className="mt-5 text-xs uppercase tracking-[0.18em] text-muted2">{p.who}</div>
              <h2 className="display mt-1 text-xl text-ink dark:text-white">{p.title}</h2>
              <p className="mt-3 text-sm text-muted2">{p.desc}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-white">
                Enter demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-5xl text-center text-xs text-muted2">
        Demo access — authentication is not wired up. In production each portal has its own JWT login and role-based permissions.
      </p>
    </main>
  );
}
