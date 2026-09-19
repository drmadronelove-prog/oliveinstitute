import Link from "next/link";

/** Past this many lessons the per-lesson dots stop being readable, so they are dropped. */
const MAX_DOTS = 30;

/**
 * "Pick up where you left off": the learner's most recently touched course,
 * its progress, and one button back into it.
 *
 * Every figure here comes from `src/lib/progress.ts` — the percentage and
 * the continue destination are computed there and passed in, never
 * re-derived from enrollments or lesson rows at this call site.
 */
export function NextUpPanel({
  courseTitle,
  href,
  ctaLabel,
  chips,
  completedLessons,
  totalLessons,
  percent,
}: {
  courseTitle: string;
  href: string | null;
  ctaLabel: string;
  chips: string[];
  completedLessons: number;
  totalLessons: number;
  percent: number;
}) {
  return (
    <div className="pop-lg mt-7 grid overflow-hidden rounded-3xl bg-[var(--gold)] lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-3.5 p-8 md:p-10">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
          Pick up where you left off
        </span>
        <h2 className="m-0 font-heading text-[clamp(30px,3.4vw,42px)] font-medium leading-[1.02] tracking-[-0.025em] text-[var(--ink)]">
          {courseTitle}
        </h2>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--paper)] px-3 py-1 font-body text-[13px] font-medium text-[var(--ink)]"
            >
              {chip}
            </span>
          ))}
        </div>
        {href ? (
          <div className="mt-2.5">
            <Link
              href={href}
              className="btn-pop inline-flex items-center gap-2.5 rounded-full bg-[var(--plum)] px-6 py-3 font-body font-semibold text-[var(--paper)]"
            >
              {ctaLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <p className="m-0 font-body text-sm text-[var(--ink)]">
            This course has no lessons yet.
          </p>
        )}
      </div>

      <div className="flex flex-col justify-center gap-[18px] border-t-2 border-[var(--ink)] bg-[var(--ink)] p-9 lg:border-l-2 lg:border-t-0">
        <p className="m-0 font-heading text-5xl font-medium leading-none text-[var(--paper)]">
          {completedLessons}{" "}
          <span className="font-body text-[15px] font-normal text-[var(--on-ink)]">
            of {totalLessons} lesson{totalLessons === 1 ? "" : "s"} done
          </span>
        </p>
        <div
          role="img"
          aria-label={`${percent}% complete`}
          className="h-2.5 overflow-hidden rounded-full border-[1.5px] border-[var(--paper)] bg-[var(--paper)]/[0.15]"
        >
          <div
            className="h-full rounded-full bg-[var(--gold)]"
            style={{ width: `${percent}%` }}
          />
        </div>
        {totalLessons > 0 && totalLessons <= MAX_DOTS ? (
          <div
            aria-hidden="true"
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${totalLessons}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: totalLessons }, (_, index) => (
              <span
                key={index}
                className={`aspect-square rounded-full ${
                  index < completedLessons
                    ? "bg-[var(--glass)]"
                    : index === completedLessons
                      ? "bg-[var(--gold)] shadow-[0_0_0_3px_rgba(197,165,114,0.35)]"
                      : "bg-[var(--paper)]/[0.18]"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
