"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAssignmentAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function CreateAssignmentForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(
    createAssignmentAction,
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

      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Title
        </label>
        <input
          name="title"
          type="text"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />
      </div>

      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Instructions
        </label>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />
      </div>

      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Due date
        </label>
        <input
          name="dueAt"
          type="datetime-local"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-forest)] px-4 py-2 font-serif text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create assignment"}
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
