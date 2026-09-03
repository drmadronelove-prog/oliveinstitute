"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createCourseAction, type CreateCourseState } from "./actions";

const initialState: CreateCourseState = { status: "idle" };

export function CreateCourseForm({
  professors,
}: {
  professors: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    createCourseAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Title
        </label>
        <input
          name="title"
          type="text"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <div>
        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Description
        </label>
        <textarea
          name="description"
          rows={2}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
            Term
          </label>
          <input
            name="term"
            type="text"
            placeholder="Fall 2026"
            required
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
          />
        </div>
        <div>
          <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
            Credits
          </label>
          <input
            name="credits"
            type="number"
            min={0}
            max={20}
            defaultValue={3}
            required
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Meeting times
        </label>
        <input
          name="meetingTimes"
          type="text"
          placeholder="Tuesdays &amp; Thursdays, 6:00–7:30 PM"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <div>
        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Instructor
        </label>
        <select
          name="professorId"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        >
          <option value="">Select an instructor…</option>
          {professors.map((professor) => (
            <option key={professor.id} value={professor.id}>
              {professor.name}
            </option>
          ))}
        </select>
        {professors.length === 0 ? (
          <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
            No instructor accounts yet — create one from{" "}
            <Link href="/admin/users" className="underline underline-offset-2">
              Manage users
            </Link>{" "}
            first.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending || professors.length === 0}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create course"}
      </button>

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
