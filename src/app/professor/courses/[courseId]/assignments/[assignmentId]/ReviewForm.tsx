"use client";

import { useActionState, useEffect, useRef } from "react";
import { reviewSubmissionAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function ReviewForm({
  courseId,
  assignmentId,
  submissionId,
  currentGrade,
}: {
  courseId: string;
  assignmentId: string;
  submissionId: string;
  currentGrade: "PASS" | "NO_PASS" | null;
}) {
  const [state, formAction, pending] = useActionState(
    reviewSubmissionAction,
    initialState,
  );
  const feedbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.status === "success" && feedbackRef.current) {
      feedbackRef.current.value = "";
    }
  }, [state]);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2 border-t border-black/10 pt-3">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="flex items-center gap-2">
        <label className="font-serif text-xs text-[var(--color-ink-muted)]">
          Grade
        </label>
        <select
          key={currentGrade ?? "none"}
          name="grade"
          defaultValue={currentGrade ?? ""}
          className="rounded-md border border-black/10 bg-white px-2 py-1 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        >
          <option value="">— No grade —</option>
          <option value="PASS">Pass</option>
          <option value="NO_PASS">No Pass</option>
        </select>
      </div>

      <textarea
        ref={feedbackRef}
        name="feedback"
        rows={2}
        placeholder="Write feedback…"
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
      />

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-[var(--color-forest)] px-3 py-1.5 font-serif text-xs font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save review"}
      </button>

      {state.status === "error" ? (
        <p className="font-serif text-xs text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="font-serif text-xs text-[var(--color-forest)]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
