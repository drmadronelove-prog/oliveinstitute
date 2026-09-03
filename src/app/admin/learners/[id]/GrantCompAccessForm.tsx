"use client";

import { useActionState } from "react";
import { grantCompAccessAction, type ActionState } from "../actions";

const initialState: ActionState = { status: "idle" };

export function GrantCompAccessForm({
  learnerId,
  courses,
}: {
  learnerId: string;
  courses: Array<{ id: string; title: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    grantCompAccessAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="learnerId" value={learnerId} />
      <select
        name="courseId"
        required
        defaultValue=""
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
      >
        <option value="">Select a course…</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || courses.length === 0}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Granting…" : "Grant access"}
      </button>
      {courses.length === 0 ? (
        <p className="font-body text-xs text-[var(--color-ink-muted)]">
          Already enrolled in every course.
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="font-body text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="font-body text-sm text-[var(--color-olive)]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
