import { Reveal } from "./Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { testimonials } from "@/lib/content";

export function Testimonials() {
  return (
    <section className="border-t border-line bg-haze py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal><Eyebrow>What clients say</Eyebrow></Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <figure className="h-full rounded-xl2 border border-line bg-white p-7 dark:bg-[#1A1E25]">
                <div className="text-3xl leading-none text-blue">&ldquo;</div>
                <blockquote className="mt-2 leading-relaxed text-navy dark:text-white">{t.quote}</blockquote>
                <figcaption className="mt-6 border-t border-line pt-4">
                  <div className="font-semibold text-navy dark:text-white">{t.name}</div>
                  <div className="text-sm text-muted2">{t.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
