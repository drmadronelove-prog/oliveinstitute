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
        required
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
      >
        <option value="">Select a student…</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending || students.length === 0}
        className="rounded-md bg-[var(--color-forest)] px-4 py-2 font-serif text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {pending ? "Enrolling…" : "Enroll student"}
      </button>

      {students.length === 0 ? (
        <p className="font-serif text-xs text-[var(--color-ink-muted)]">
          All students are already enrolled, or no student accounts exist
          yet.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="font-serif text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="font-serif text-sm text-[var(--color-forest)]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
