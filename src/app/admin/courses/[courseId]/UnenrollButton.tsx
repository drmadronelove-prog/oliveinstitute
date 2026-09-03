"use client";

import { useActionState } from "react";
import { unenrollStudentAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function UnenrollButton({
  courseId,
  enrollmentId,
}: {
  courseId: string;
  enrollmentId: string;
}) {
  const [, formAction, pending] = useActionState(
    unenrollStudentAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <button
        type="submit"
        disabled={pending}
        className="font-serif text-xs text-[var(--color-forest)] underline underline-offset-2 hover:text-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {pending ? "Removing…" : "Unenroll"}
      </button>
    </form>
  );
}
