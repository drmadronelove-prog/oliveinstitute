"use client";

import { useActionState } from "react";
import { updateCreditStatusAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

const CREDIT_OPTIONS = [
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "CREDIT", label: "Credit" },
  { value: "NO_CREDIT", label: "No credit" },
  { value: "INCOMPLETE", label: "Incomplete" },
];

export function CreditStatusForm({
  courseId,
  enrollmentId,
  currentStatus,
}: {
  courseId: string;
  enrollmentId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateCreditStatusAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <select
        key={currentStatus}
        name="creditStatus"
        defaultValue={currentStatus}
        className="rounded-md border border-black/10 bg-white px-2 py-1 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
      >
        {CREDIT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-[var(--color-forest)] px-2 py-1 font-serif text-xs text-[var(--color-forest)] transition-colors hover:bg-[var(--color-forest)] hover:text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.status === "error" ? (
        <span className="font-serif text-xs text-red-700">{state.message}</span>
      ) : null}
      {state.status === "success" ? (
        <span className="font-serif text-xs text-[var(--color-forest)]">Saved</span>
      ) : null}
    </form>
  );
}
