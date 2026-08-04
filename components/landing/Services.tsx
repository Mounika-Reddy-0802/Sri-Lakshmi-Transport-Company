import { Reveal } from "./Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { services } from "@/lib/mock-data";

export function Services() {
  return (
    <section id="services" className="border-t border-line bg-haze py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal><Eyebrow>Services</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="display mt-4 max-w-2xl text-3xl text-navy dark:text-white sm:text-4xl">
            Complete transport for businesses and schools.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.05}>
              <div className="h-full rounded-xl2 border border-line bg-white p-7 dark:bg-[#1A1E25]">
                <span className="tnum text-sm font-semibold text-blue">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="display mt-3 text-lg text-navy dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted2">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
