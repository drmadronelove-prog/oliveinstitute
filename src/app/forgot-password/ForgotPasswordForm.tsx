"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold text-[var(--color-olive)]">
          Check your email
        </h1>
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          {state.message}
        </p>
        <Link
          href="/login"
          className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold text-[var(--color-olive)]">
        Forgot your password?
      </h1>
      <p className="font-body text-sm text-[var(--color-ink-muted)]">
        Enter your email address and we&apos;ll send you a link to choose a new
        one.
      </p>

      <div>
        <label
          htmlFor="email"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      {state.status === "error" ? (
        <p className="font-body text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      <Link
        href="/login"
        className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
      >
        Back to sign in
      </Link>
    </form>
  );
}
