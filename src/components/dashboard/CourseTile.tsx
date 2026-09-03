import Link from "next/link";

export function CourseTile({
  href,
  title,
  term,
  credits,
  secondaryLabel,
  muted = false,
}: {
  href: string;
  title: string;
  term: string;
  credits: number;
  secondaryLabel?: string;
  /** Flattened, low-contrast treatment for past-enrolled tiles. */
  muted?: boolean;
}) {
  if (muted) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-black/10 bg-[var(--color-cream-warm)] p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
      >
        <h4 className="font-heading text-lg font-semibold text-[var(--color-ink-muted)]">
          {title}
        </h4>
        <div className="my-2 h-[2px] w-10 bg-[var(--color-ink-muted)]/30" />
        <p className="font-serif text-sm text-[var(--color-ink-muted)]">
          {term} &middot; {credits} credits
        </p>
        {secondaryLabel && (
          <span className="mt-3 inline-block rounded-full bg-black/5 px-3 py-0.5 font-serif text-xs text-[var(--color-ink-muted)]">
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
      <p className="font-serif text-sm text-white/85">
        {term} &middot; {credits} credits
      </p>
      {secondaryLabel && (
        <span className="mt-3 inline-block rounded-full bg-white/15 px-3 py-0.5 font-serif text-xs text-white">
          {secondaryLabel}
        </span>
      )}
    </Link>
  );
}
