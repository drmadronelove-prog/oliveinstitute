"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = { status: "idle" };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Current password
        </label>
        <input
          name="currentPassword"
          type="password"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />
      </div>

      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          New password
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />
        <p className="mt-1 font-serif text-xs text-[var(--color-ink-muted)]">
          At least 8 characters.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-forest)] px-4 py-2 font-serif text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>

      {state.status === "error" ? (
        <p className="font-serif text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="font-serif text-sm text-[var(--color-forest)]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
