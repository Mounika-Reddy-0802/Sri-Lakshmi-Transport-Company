import { Reveal } from "./Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { bento, clients } from "@/lib/content";

const toneCls: Record<string, string> = {
  navy: "bg-navy text-white",
  green: "bg-greensoft text-navy dark:bg-green/15 dark:text-white",
  blue: "bg-bluesoft text-navy dark:bg-blue/15 dark:text-white",
};
const base = "bg-white text-navy dark:bg-[#1A1E25] dark:text-white border border-line";

export function Bento() {
  return (
    <section id="why" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal><Eyebrow>Why institutions choose SLTC</Eyebrow></Reveal>
        <Reveal delay={0.05}>
          <h2 className="display mt-4 max-w-2xl text-3xl text-navy dark:text-white sm:text-4xl">
            Everything procurement and admin teams look for.
          </h2>
        </Reveal>

        <div className="mt-12 grid auto-rows-[minmax(150px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bento.map((b, i) => (
            <Reveal key={b.key} delay={(i % 3) * 0.05} className={b.span}>
              <div className={`flex h-full flex-col justify-between rounded-xl2 p-6 ${b.tone ? toneCls[b.tone] ?? base : base}`}>
                <div>
                  <h3 className="display text-lg">{b.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${b.tone === "navy" ? "text-white/75" : "text-muted2 dark:text-white/70"}`}>{b.body}</p>
                </div>
                {b.stat && (
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="display text-3xl">{b.stat}</span>
                    {b.statLabel && <span className={`text-xs uppercase tracking-wide ${b.tone === "navy" ? "text-white/60" : "text-muted2"}`}>{b.statLabel}</span>}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
          {/* clients highlight fills the grid */}
          <Reveal delay={0.1}>
            <div className={`flex h-full flex-col justify-between rounded-xl2 p-6 ${base}`}>
              <h3 className="display text-lg">Trusted partners</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="display text-3xl text-blue">{clients.length}+</span>
                <span className="text-xs uppercase tracking-wide text-muted2">active clients</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
