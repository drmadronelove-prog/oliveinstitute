import Link from "next/link";

/** The tiles cycle through three surfaces so a row of them reads as a set rather than a list. */
const TONES = {
  glass: "bg-[var(--glass)]",
  paper: "bg-[var(--paper)]",
  rose: "bg-[var(--rose)]",
} as const;

export type CourseTileTone = keyof typeof TONES;

export const TILE_TONES: CourseTileTone[] = ["glass", "paper", "rose"];

export function CourseTile({
  href,
  title,
  meta,
  secondaryLabel,
  tone = "paper",
  muted = false,
}: {
  href: string;
  title: string;
  /** Short line under the title, e.g. "Clinician · 3h 10m". */
  meta: string;
  secondaryLabel?: string;
  tone?: CourseTileTone;
  /** Flattened treatment for a course that is finished rather than in progress. */
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`pop pop-hover-sm flex flex-col gap-2.5 rounded-[18px] p-6 text-[var(--ink)] ${
        muted ? "bg-[var(--linen)]" : TONES[tone]
      }`}
    >
      <h3 className="m-0 font-heading text-[21px] font-medium leading-[1.15] tracking-[-0.015em]">
        {title}
      </h3>
      <p className="m-0 font-mono text-xs text-[var(--ink)]">{meta}</p>
      {secondaryLabel ? (
        <span className="mt-auto self-start rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--paper)] px-2.5 py-1 font-body text-xs font-semibold text-[var(--ink)]">
          {secondaryLabel}
        </span>
      ) : null}
    </Link>
  );
}
