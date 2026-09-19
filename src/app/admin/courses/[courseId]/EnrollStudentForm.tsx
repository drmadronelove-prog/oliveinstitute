"use client";

import { useActionState } from "react";
import { enrollStudentAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function EnrollStudentForm({
  courseId,
  students,
}: {
  courseId: string;
  students: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    enrollStudentAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="courseId" value={courseId} />
      <select
        name="studentId"
        aria-label="Learner"
        required
        className="w-full rounded-lg border-[1.5px] border-[var(--ink)] bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
      >
        <option value="">Select a learner…</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending || students.length === 0}
        className="btn-pop rounded-xl bg-[var(--plum)] px-4 py-2 font-body text-sm font-medium text-[var(--paper)] hover:bg-[var(--color-terracotta-dark)] disabled:opacity-60"
      >
        {pending ? "Enrolling…" : "Enroll learner"}
      </button>

      {students.length === 0 ? (
        <p className="font-body text-xs text-[var(--color-ink-muted)]">
          All learners are already enrolled, or no learner accounts exist
          yet.
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
