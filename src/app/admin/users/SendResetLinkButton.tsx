"use client";

import { useActionState } from "react";
import {
  sendPasswordResetForUserAction,
  type SendResetState,
} from "./actions";

const initialState: SendResetState = { status: "idle" };

export function SendResetLinkButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(
    sendPasswordResetForUserAction,
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
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      {state.status === "success" ? (
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          {state.message}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="mt-1 font-body text-xs text-red-700">{state.message}</p>
      ) : null}
    </div>
  );
}
