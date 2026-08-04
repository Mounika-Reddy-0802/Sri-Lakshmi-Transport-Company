"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

const links = [
  { href: "#why", label: "Why us" },
  { href: "#services", label: "Services" },
  { href: "#safety", label: "Safety" },
  { href: "#clients", label: "Clients" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? "border-line bg-white/90 py-3 backdrop-blur dark:bg-[#14171C]/90" : "border-transparent py-5"}`}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5">
        <Link href="/"><Logo size={40} withName /></Link>
        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted2 transition hover:text-navy dark:hover:text-white">{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Link href="/login" className="hidden text-sm font-medium text-muted2 hover:text-navy dark:hover:text-white sm:block">Portals</Link>
          <Button href="#contact" variant="cta" className="!px-5 !py-2.5">Request a quote</Button>
        </div>
      </nav>
    </header>
  );
}
