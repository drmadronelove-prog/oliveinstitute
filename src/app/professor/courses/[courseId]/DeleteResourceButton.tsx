"use client";

import { useActionState } from "react";
import { deleteResourceAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function DeleteResourceButton({
  lessonId,
  resourceId,
}: {
  lessonId: string;
  resourceId: string;
}) {
  const [, formAction, pending] = useActionState(
    deleteResourceAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="resourceId" value={resourceId} />
      <button
        type="submit"
        disabled={pending}
        className="font-body text-xs text-red-700 underline underline-offset-2 disabled:opacity-60"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}
