"use client";

import { useActionState } from "react";
import { unenrollFromLearnerPageAction, type ActionState } from "../actions";

const initialState: ActionState = { status: "idle" };

export function UnenrollFromLearnerButton({
  learnerId,
  enrollmentId,
}: {
  learnerId: string;
  enrollmentId: string;
}) {
  const [, formAction, pending] = useActionState(
    unenrollFromLearnerPageAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="learnerId" value={learnerId} />
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <button
        type="submit"
        disabled={pending}
        className="font-body text-xs text-[var(--color-olive)] underline underline-offset-2 hover:text-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Removing…" : "Unenroll"}
      </button>
    </form>
  );
}
