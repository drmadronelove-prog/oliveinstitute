import type { ReactNode } from "react";

export function Card({
  children,
  accentColor,
  className = "",
}: {
  children: ReactNode;
  /** CSS color for a 4px left accent bar, e.g. "var(--color-gold)" */
  accentColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl bg-[var(--color-card)] p-5 shadow-sm ring-1 ring-black/5 ${className}`}
      style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
    >
      {children}
    </div>
  );
}
