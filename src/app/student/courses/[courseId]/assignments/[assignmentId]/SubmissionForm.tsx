"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitAssignmentAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function SubmissionForm({
  courseId,
  assignmentId,
}: {
  courseId: string;
  assignmentId: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitAssignmentAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />

      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Upload a file
        </label>
        <input
          name="file"
          type="file"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)]"
        />
        <p className="mt-1 font-serif text-xs text-[var(--color-ink-muted)]">
          Up to 25 MB. Or write a text submission below instead.
        </p>
      </div>

      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Text submission
        </label>
        <textarea
          name="text"
          rows={5}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-forest)] px-4 py-2 font-serif text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit"}
      </button>

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
