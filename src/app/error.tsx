"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md pop-lg rounded-[22px] bg-[var(--color-card)] p-8">
        <h1 className="mb-2 font-heading text-xl font-medium text-[var(--color-ink)]">
          Something went wrong
        </h1>
        <p className="mb-4 font-body text-sm text-[var(--color-ink-muted)]">
          An unexpected error occurred. You can try again, or head back to
          your dashboard.
        </p>
        {error.digest ? (
          <p className="mb-4 font-body text-xs text-[var(--color-ink-muted)]">
            Error reference: {error.digest}
          </p>
        ) : null}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="btn-pop rounded-xl bg-[var(--plum)] px-4 py-2 font-body text-sm font-medium text-[var(--paper)] hover:bg-[var(--color-terracotta-dark)]"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="btn-pop rounded-xl bg-[var(--paper)] px-4 py-2 font-body text-sm text-[var(--color-ink)] hover:bg-[var(--color-sage-pale)]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
