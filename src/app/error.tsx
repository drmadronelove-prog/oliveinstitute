"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-card)] p-8 shadow-sm ring-1 ring-black/5">
        <h1 className="mb-2 font-heading text-xl font-semibold text-[var(--color-ink)]">
          Something went wrong
        </h1>
        <p className="mb-4 font-serif text-sm text-[var(--color-ink-muted)]">
          An unexpected error occurred. You can try again, or head back to
          your dashboard.
        </p>
        {error.digest ? (
          <p className="mb-4 font-serif text-xs text-[var(--color-ink-muted)]">
            Error reference: {error.digest}
          </p>
        ) : null}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-[var(--color-forest)] px-4 py-2 font-serif text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)]"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-md border border-black/10 px-4 py-2 font-serif text-sm text-[var(--color-ink)] hover:bg-[var(--color-cream)]"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
