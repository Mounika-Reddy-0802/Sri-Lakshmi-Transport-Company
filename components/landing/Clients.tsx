import { Reveal } from "./Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { clients } from "@/lib/content";

export function Clients() {
  return (
    <section id="clients" className="border-t border-line py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal><Eyebrow>Clients</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="display mt-4 max-w-2xl text-3xl text-navy dark:text-white sm:text-4xl">
            Pharma, corporate and education partners across Telangana.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {clients.map((c, i) => (
            <Reveal key={c.name} delay={(i % 4) * 0.04}>
              <div className="h-full rounded-xl2 border border-line bg-white p-6 dark:bg-[#1A1E25]">
                <div className="display text-base text-navy dark:text-white">{c.name}</div>
                <div className="mt-1 text-sm text-muted2">{c.location}</div>
                <div className="mt-4 text-xs font-medium uppercase tracking-wide text-blue">{c.since}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
