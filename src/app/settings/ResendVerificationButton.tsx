"use client";

import { useActionState } from "react";
import { resendVerificationAction, type SettingsState } from "./actions";

const initialState: SettingsState = { status: "idle" };

export function ResendVerificationButton() {
  const [state, formAction, pending] = useActionState(
    async () => resendVerificationAction(),
    initialState,
  );

  return (
    <form action={formAction} className="mt-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-[var(--color-olive)] px-3 py-1.5 font-body text-sm text-[var(--color-olive)] transition-colors hover:bg-[var(--color-olive)] hover:text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send a new confirmation email"}
      </button>

      {state.status === "error" ? (
        <p className="mt-2 font-body text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="mt-2 font-body text-sm text-[var(--color-olive)]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
