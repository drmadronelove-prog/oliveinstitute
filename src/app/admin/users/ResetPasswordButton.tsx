"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = { status: "idle" };

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={pending}
          className="font-body text-xs text-[var(--color-olive)] underline underline-offset-2 hover:text-[var(--color-olive-dark)] disabled:opacity-60"
        >
          {pending ? "Resetting…" : "Reset password"}
        </button>
      </form>

      {state.status === "success" ? (
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          New password:{" "}
          <code className="rounded bg-white px-1 py-0.5">
            {state.tempPassword}
          </code>
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="mt-1 font-body text-xs text-red-700">{state.message}</p>
      ) : null}
    </div>
  );
}
