"use client";

import { useActionState } from "react";
import { deleteUserAction, type DeleteUserState } from "./actions";

const initialState: DeleteUserState = { status: "idle" };

/**
 * Deleting an account is irreversible, so it asks first — the same
 * window.confirm pattern the course builder uses for modules and lessons.
 * The server decides whether it is allowed at all; this is only the guard
 * against a mis-click.
 */
export function DeleteUserButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteUserAction,
    initialState,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Delete ${name}? This removes the account and any course enrolments and progress it has. It can't be undone.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <button
          type="submit"
          disabled={pending}
          className="font-body text-xs text-red-700 underline underline-offset-2 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </form>

      {state.status === "error" ? (
        <p className="mt-1 max-w-[28rem] font-body text-xs text-red-700">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
