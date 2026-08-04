import { Reveal } from "./Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Check } from "lucide-react";
import { safety, about } from "@/lib/content";

export function Safety() {
  return (
    <section id="safety" className="border-t border-line py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <Reveal>
          <PhotoSlot label="Your drivers & vehicles" ratio="aspect-[4/3]" />
        </Reveal>
        <div>
          <Reveal><Eyebrow tone="green">Safety &amp; trust</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h2 className="display mt-4 text-3xl leading-snug text-navy dark:text-white sm:text-4xl">
              Built for the responsibility of carrying students and staff.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl leading-relaxed text-muted2">{about}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {safety.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-greensoft text-green dark:bg-green/20">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-navy dark:text-white/90">{s}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
