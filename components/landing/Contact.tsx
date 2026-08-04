"use client";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { company } from "@/lib/content";

const fields = [
  { name: "name", label: "Name", type: "text" },
  { name: "org", label: "Organization", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "tel" },
];

export function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="border-t border-line py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
        <div>
          <Reveal><Eyebrow tone="muted">Request a quote</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-4 text-3xl text-navy dark:text-white sm:text-4xl">
              Tell us your routes. We&apos;ll handle the rest.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-md leading-relaxed text-muted2">
              Share your pickup locations, headcount and timings, and our team will prepare a tailored proposal — no online booking, just a real conversation.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <div className="mt-8 space-y-4">
              {company.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="flex items-center gap-3 font-medium text-navy dark:text-white">
                  <Phone size={18} className="text-blue" /> {p}
                </a>
              ))}
              {company.emails.map((e) => (
                <a key={e} href={`mailto:${e}`} className="flex items-center gap-3 break-all text-navy dark:text-white">
                  <Mail size={18} className="shrink-0 text-blue" /> {e}
                </a>
              ))}
              <div className="flex items-center gap-3 text-muted2">
                <MapPin size={18} className="text-blue" /> Hyderabad &amp; Telangana
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-xl2 border border-line bg-white p-7 shadow-soft dark:bg-[#1A1E25]">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="text-green" size={42} />
                <p className="display mt-4 text-xl text-navy dark:text-white">Request received</p>
                <p className="mt-2 text-sm text-muted2">This is a demo form — no data was sent anywhere.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((f) => (
                    <label key={f.name} className="block">
                      <span className="text-sm text-muted2">{f.label}</span>
                      <input type={f.type}
                        className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm outline-none transition focus:border-blue dark:focus:border-white/40" />
                    </label>
                  ))}
                </div>
                <label className="block">
                  <span className="text-sm text-muted2">Requirement</span>
                  <textarea rows={3} placeholder="Routes, headcount, timings…"
                    className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-4 py-3 text-sm outline-none transition placeholder:text-mist focus:border-blue dark:focus:border-white/40" />
                </label>
                <Button onClick={() => setSent(true)} variant="cta" className="mt-1 w-full">Request a quote</Button>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
