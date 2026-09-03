"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  assessPasswordStrength,
  MIN_PASSWORD_SCORE,
} from "@/lib/password";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = { status: "idle" };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );
  const [password, setPassword] = useState("");

  const assessment = assessPasswordStrength(password);

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold text-[var(--color-olive)]">
          Password updated
        </h1>
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          {state.message}
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-[var(--color-olive)] px-4 py-2.5 text-center font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <h1 className="font-heading text-2xl font-semibold text-[var(--color-olive)]">
        Choose a new password
      </h1>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
        <p
          className={`mt-1 font-body text-xs ${
            password.length > 0 && assessment.score >= MIN_PASSWORD_SCORE
              ? "text-[var(--color-olive)]"
              : "text-[var(--color-ink-muted)]"
          }`}
        >
          {password.length === 0
            ? "At least 10 characters, with a mix of character types."
            : `${assessment.label}${
                assessment.issues.length > 0 ? ` — ${assessment.issues[0]}` : ""
              }`}
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>

      {state.status === "error" ? (
        <p className="font-body text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      <Link
        href="/forgot-password"
        className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
      >
        Request a new link
      </Link>
    </form>
  );
}
