/**
 * The Olive Institute mark: an olive with a bite of negative space where a
 * highlight would sit, drawn as a single even-odd path so the hole shows
 * whatever is behind it. Inherits `currentColor`, which is what lets the
 * same file serve as the nav lockup, a decorative drifting shape, and the
 * separator dot in the course ticker.
 *
 * This replaces nothing — there is still no photographic logo asset — but
 * it is the artwork the text wordmark stood in for. Swap a real file in
 * here if one is ever drawn.
 */
export function OliveMark({
  className = "",
  title,
}: {
  className?: string;
  /** Give the mark an accessible name. Omit it wherever the mark is decorative. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M 100 30 C 138 30, 166 60, 166 100 C 166 140, 138 170, 100 170 C 62 170, 34 140, 34 100 C 34 60, 62 30, 100 30 Z M 108 46 C 120.15 46, 130 55.85, 130 68 C 130 80.15, 120.15 90, 108 90 C 95.85 90, 86 80.15, 86 68 C 86 55.85, 95.85 46, 108 46 Z"
      />
    </svg>
  );
}
