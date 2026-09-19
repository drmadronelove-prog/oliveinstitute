import type { ReactNode } from "react";
import { DriftingOlives } from "@/components/brand/DriftingOlives";

/**
 * The coloured band at the top of a dashboard: a greeting, a gold rule, a
 * line of context, and a panel of drifting olives. Plum for a learner,
 * gold for staff — the same two surfaces the rest of the design uses for
 * "yours" and "the Institute's".
 *
 * This replaced `HeroCard`, whose photo panel had nothing to show once the
 * decorative art became the olives themselves.
 */
export function DashboardBand({
  tone,
  title,
  subtext,
}: {
  tone: "plum" | "gold";
  /** Rendered rather than a plain string so a name can be emphasised. */
  title: ReactNode;
  subtext: string;
}) {
  const surface =
    tone === "plum"
      ? "bg-[var(--plum)] text-[var(--paper)]"
      : "bg-[var(--gold)] text-[var(--ink)]";
  const rule = tone === "plum" ? "bg-[var(--gold)]" : "bg-[var(--ink)]";
  const body = tone === "plum" ? "text-[var(--on-plum)]" : "text-[var(--ink)]";

  return (
    <div
      className={`pop-lg relative grid items-center gap-6 overflow-hidden rounded-3xl px-8 py-10 md:grid-cols-[1fr_300px] md:px-11 ${surface}`}
    >
      <div>
        <h1 className="m-0 font-heading text-[clamp(2.4rem,4.6vw,3.75rem)] font-medium leading-none tracking-[-0.03em]">
          {title}
        </h1>
        <div className={`mt-3.5 h-[2px] w-14 ${rule}`} />
        <p className={`mt-2.5 max-w-[32rem] font-body text-lg ${body}`}>
          {subtext}
        </p>
      </div>
      <DriftingOlives variant="band" tone={tone} className="hidden md:block" />
    </div>
  );
}
