"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-pop rounded-xl bg-[var(--plum)] px-4 py-2 font-body text-sm font-medium text-[var(--paper)] hover:bg-[var(--color-terracotta-dark)]"
    >
      Print / Save as PDF
    </button>
  );
}
