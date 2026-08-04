import { Counter } from "@/components/ui/Counter";
import { Reveal } from "./Reveal";
import { stats } from "@/lib/mock-data";

export function Stats() {
  return (
    <section className="border-y border-line bg-haze">
      <div className="mx-auto grid max-w-6xl grid-cols-2 px-5 md:grid-cols-4 md:divide-x md:divide-line">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06} className="py-10 md:px-7 md:first:pl-0">
            <div className="display text-3xl text-navy dark:text-white sm:text-4xl">
              {"literal" in s && s.literal ? <span className="tnum">{s.value}</span> : <Counter to={s.value} suffix={s.suffix} />}
            </div>
            <div className="mt-2 text-sm leading-snug text-muted2">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
