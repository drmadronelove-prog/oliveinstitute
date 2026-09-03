import Link from "next/link";

export function CourseTile({
  href,
  title,
  meta,
  secondaryLabel,
  muted = false,
}: {
  href: string;
  title: string;
  /** Short line under the title, e.g. "Clinician · 3h 10m". */
  meta: string;
  secondaryLabel?: string;
  /** Flattened, low-contrast treatment for past-enrolled tiles. */
  muted?: boolean;
}) {
  if (muted) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-black/10 bg-[var(--color-sage-pale-top)] p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
      >
        <h4 className="font-heading text-lg font-semibold text-[var(--color-ink-muted)]">
          {title}
        </h4>
        <div className="my-2 h-[2px] w-10 bg-[var(--color-ink-muted)]/30" />
        <p className="font-body text-sm text-[var(--color-ink-muted)]">{meta}</p>
        {secondaryLabel && (
          <span className="mt-3 inline-block rounded-full bg-black/5 px-3 py-0.5 font-body text-xs text-[var(--color-ink-muted)]">
            {secondaryLabel}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-xl bg-[var(--color-sage)] p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <h4 className="font-heading text-lg font-semibold text-white">{title}</h4>
      <div className="my-2 h-[2px] w-10 bg-[var(--color-gold-light)]" />
      <p className="font-body text-sm text-white/85">{meta}</p>
      {secondaryLabel && (
        <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-0.5 font-body text-xs text-white">
          {secondaryLabel}
        </span>
      )}
    </Link>
  );
}
