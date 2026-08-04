"use client";
import { motion } from "framer-motion";
import { ArrowRight, Phone, ShieldCheck, Clock, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { company } from "@/lib/mock-data";

const trust = [
  { icon: BadgeCheck, label: "Licensed since 2020" },
  { icon: ShieldCheck, label: "Trained drivers" },
  { icon: Clock, label: "24/7 service" },
];

export function Hero() {
  return (
    <section className="relative bg-white pt-36 pb-20 dark:bg-[#14171C]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
            Employee · School · Outstation transport
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }}
            className="display mt-5 text-[2.7rem] leading-[1.07] text-navy dark:text-white sm:text-6xl">
            Safe, reliable transport your institution can trust.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.14 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-muted2">
            {company.sub}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-3">
            <Button href="#contact" variant="cta">Request a quote <ArrowRight size={16} /></Button>
            <Button href={`tel:${company.phones[0].replace(/\s/g, "")}`} variant="outline"><Phone size={16} /> {company.phones[0]}</Button>
          </motion.div>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
            {trust.map((t) => (
              <li key={t.label} className="flex items-center gap-2 text-sm font-medium text-navy dark:text-white">
                <t.icon size={17} className="text-green" /> {t.label}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="relative">
          <PhotoSlot label="Your fleet, on the road" ratio="aspect-[5/4]" />
          {/* The single glass accent: a floating quote card */}
          <div className="glass absolute -bottom-6 -left-4 w-60 rounded-xl2 p-5 shadow-glass sm:-left-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue">Get started</div>
            <p className="mt-1.5 text-sm font-medium leading-snug text-navy dark:text-white">
              Tell us your routes and headcount — we'll send a tailored quote.
            </p>
            <Button href="#contact" variant="cta" className="mt-4 w-full !py-2.5">Request a quote</Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
