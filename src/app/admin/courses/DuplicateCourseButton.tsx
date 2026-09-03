"use client";

import { useActionState } from "react";
import { duplicateCourseAction, type CreateCourseState } from "./actions";

const initialState: CreateCourseState = { status: "idle" };

export function DuplicateCourseButton({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(
    duplicateCourseAction,
    initialState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        disabled={pending}
        className="font-body text-xs text-[var(--color-olive)] underline underline-offset-2 disabled:opacity-60"
      >
        {pending ? "Duplicating…" : "Duplicate"}
      </button>
      {state.status === "error" ? (
        <span className="ml-2 font-body text-xs text-red-700">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
