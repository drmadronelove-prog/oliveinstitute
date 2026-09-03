export function Badge({ children }: { children: string }) {
  return (
    <span className="inline-block rounded-full bg-[var(--color-sage)]/15 px-3 py-0.5 font-serif text-xs font-medium text-[var(--color-sage-dark)]">
      {children}
    </span>
  );
}
