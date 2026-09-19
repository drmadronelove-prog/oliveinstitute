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
    <main className="flex flex-1 items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm pop-lg rounded-[22px] bg-[var(--color-card)] p-8"
      >
        <div className="mb-6 flex flex-col gap-1">
          <Wordmark tone="dark" />
          <p className="font-body text-xs italic text-[var(--color-ink-muted)]">
            self-paced courses
          </p>
        </div>

        <h1 className="mb-6 font-heading text-xl font-medium text-[var(--color-ink)]">
          Sign in
        </h1>

        <label
          htmlFor="login-email"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          className="mb-4 w-full rounded-lg border-[1.5px] border-[var(--ink)] bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />

        <label
          htmlFor="login-password"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          className="mb-6 w-full rounded-lg border-[1.5px] border-[var(--ink)] bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />

        {state.status === "error" ? (
          <p className="mb-4 font-body text-sm text-red-700" role="alert">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-pop rounded-xl bg-[var(--plum)] px-4 py-2 font-body text-sm font-medium text-[var(--paper)] hover:bg-[var(--color-terracotta-dark)] disabled:opacity-60"
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
    </main>
  );
}
