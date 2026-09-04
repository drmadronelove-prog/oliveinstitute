export function Badge({ children }: { children: string }) {
  return (
    <span className="inline-block rounded-full bg-[var(--color-sage)]/15 px-3 py-0.5 font-body text-xs font-medium text-[var(--color-olive-dark)]">
      {children}
    </span>
  );
}
