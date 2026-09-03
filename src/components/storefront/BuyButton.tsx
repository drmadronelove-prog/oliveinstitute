"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/basePath";

/**
 * Posts to POST /api/checkout and follows the Stripe-hosted URL it returns.
 * A hand-built fetch, not a Server Action: /api/checkout is a real REST
 * endpoint (Stripe's redirect back also has to land somewhere plain HTTP
 * can reach), so this is the one client-side fetch in an otherwise
 * Server-Action-first codebase.
 */
export function BuyButton({
  courseId,
  priceLabel,
}: {
  courseId: string;
  priceLabel: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(withBasePath("/api/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !data?.url) {
        setError(data?.error ?? "Something went wrong. Try again.");
        setPending(false);
        return;
      }

      // Leave `pending` true: the browser is about to navigate away, and a
      // button that stays disabled during that beat is better than one that
      // flickers back to life a moment before the redirect lands.
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-full rounded-md bg-[var(--color-olive)] px-4 py-3 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Redirecting…" : `Buy — ${priceLabel}`}
      </button>
      {error ? (
        <p className="mt-2 font-body text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
