/**
 * A small outlined pill. Ink on glass clears 7:1, so a badge stays legible
 * at the compact size the UI uses it at — see CLAUDE.md, phase 11, for why
 * the previous tinted-background-with-tinted-text version did not.
 */
export function Badge({ children }: { children: string }) {
  return (
    <span className="inline-block rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--glass)] px-2.5 py-0.5 font-body text-xs font-semibold text-[var(--ink)]">
      {children}
    </span>
  );
}
