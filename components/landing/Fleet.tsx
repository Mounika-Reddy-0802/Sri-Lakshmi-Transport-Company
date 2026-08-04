import { Reveal } from "./Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { fleet } from "@/lib/content";

export function Fleet() {
  return (
    <section id="fleet" className="border-t border-line bg-haze py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal><Eyebrow>The fleet</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="display mt-4 max-w-2xl text-3xl text-navy dark:text-white sm:text-4xl">
            Right-sized vehicles, from 5 to 44 seats.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fleet.map((f, i) => (
            <Reveal key={f.type} delay={i * 0.06}>
              <div className="h-full overflow-hidden rounded-xl2 border border-line bg-white dark:bg-[#1A1E25]">
                <PhotoSlot label={`${f.type}`} ratio="aspect-[4/3]" className="!rounded-none" />
                <div className="p-5">
                  <h3 className="display text-lg text-navy dark:text-white">{f.type}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted2">{f.use}</p>
                  <p className="mt-3 text-sm font-semibold text-blue">Up to {f.capacity} seats · AC / Non-AC</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
