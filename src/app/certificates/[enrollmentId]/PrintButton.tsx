"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
    >
      Print / Save as PDF
    </button>
  );
}
