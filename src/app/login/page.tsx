"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Wordmark } from "@/components/shell/Wordmark";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export default function LoginPage() {
  const [state, formAction, submitting] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl bg-[var(--color-card)] p-8 shadow-sm ring-1 ring-black/5"
      >
        <div className="mb-6 flex flex-col gap-1">
          <Wordmark tone="dark" />
          <p className="font-body text-xs italic text-[var(--color-ink-muted)]">
            self-paced courses
          </p>
        </div>

        <h1 className="mb-6 font-heading text-xl font-semibold text-[var(--color-ink)]">
          Sign in
        </h1>

        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="mb-4 w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />

        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          className="mb-6 w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />

        {state.status === "error" ? (
          <p className="mb-4 font-body text-sm text-red-700" role="alert">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <div className="mt-5 flex flex-col gap-2 border-t border-black/10 pt-4">
          <Link
            href="/forgot-password"
            className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
          >
            Forgot your password?
          </Link>
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            New here?{" "}
            <Link
              href="/register"
              className="text-[var(--color-olive)] underline underline-offset-2"
            >
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
