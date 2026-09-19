import type { ReactNode } from "react";

/**
 * The base surface: a 2px ink outline and a hard, un-blurred shadow offset
 * down and right (`.pop` in globals.css). Every content panel in the app is
 * built from this, so the outline treatment is defined once here rather
 * than repeated per page.
 */
export function Card({
  children,
  accentColor,
  className = "",
}: {
  children: ReactNode;
  /** CSS color for a 4px left accent bar, e.g. "var(--gold)" */
  accentColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`pop rounded-[18px] bg-[var(--color-card)] p-5 ${className}`}
      style={accentColor ? { borderLeft: `6px solid ${accentColor}` } : undefined}
    >
      {children}
    </div>
  );
}
