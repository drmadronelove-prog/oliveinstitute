"use client";

import { useActionState } from "react";
import { reassignProfessorAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function ReassignProfessorForm({
  courseId,
  currentProfessorId,
  professors,
}: {
  courseId: string;
  currentProfessorId: string;
  professors: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    reassignProfessorAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="courseId" value={courseId} />
      <select
        name="professorId"
        defaultValue={currentProfessorId}
        className="rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
      >
        {professors.map((professor) => (
          <option key={professor.id} value={professor.id}>
            {professor.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-[var(--color-forest)] px-3 py-2 font-serif text-sm text-[var(--color-forest)] transition-colors hover:bg-[var(--color-forest)] hover:text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.status === "error" ? (
        <span className="font-serif text-xs text-red-700">{state.message}</span>
      ) : null}
      {state.status === "success" ? (
        <span className="font-serif text-xs text-[var(--color-forest)]">
          Saved.
        </span>
      ) : null}
    </form>
  );
}
