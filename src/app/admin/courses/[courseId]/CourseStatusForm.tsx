"use client";

import { useActionState } from "react";
import {
  updateCourseStatusAction,
  type CreateCourseState,
} from "../actions";

const initialState: CreateCourseState = { status: "idle" };

export function CourseStatusForm({
  courseId,
  currentStatus,
}: {
  courseId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCourseStatusAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="courseId" value={courseId} />
      <select
        name="status"
        aria-label="Course status"
        // Remount when the saved value changes, so the select shows the
        // server's value rather than a stale mounted default.
        key={currentStatus}
        defaultValue={currentStatus}
        className="rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
      >
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-[var(--color-olive)] px-3 py-2 font-body text-sm text-[var(--color-olive)] transition-colors hover:bg-[var(--color-olive)] hover:text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.status === "error" ? (
        <span className="font-body text-xs text-red-700">{state.message}</span>
      ) : null}
      {state.status === "success" ? (
        <span className="font-body text-xs text-[var(--color-olive)]">Saved.</span>
      ) : null}
    </form>
  );
}
