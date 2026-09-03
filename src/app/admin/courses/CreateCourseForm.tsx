"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createCourseAction, type CreateCourseState } from "./actions";

const initialState: CreateCourseState = { status: "idle" };

const fieldClassName =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]";
const labelClassName =
  "mb-1 block font-body text-sm font-medium text-[var(--color-ink)]";

export function CreateCourseForm({
  instructors,
}: {
  instructors: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(
    createCourseAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className={labelClassName}>Title</label>
        <input name="title" type="text" required className={fieldClassName} />
      </div>

      <div>
        <label className={labelClassName}>Slug</label>
        <input
          name="slug"
          type="text"
          required
          placeholder="trauma-informed-care-foundations"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          className={fieldClassName}
        />
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          Lowercase, hyphen-separated. Used in the course URL.
        </p>
      </div>

      <div>
        <label className={labelClassName}>Subtitle</label>
        <input name="subtitle" type="text" className={fieldClassName} />
      </div>

      <div>
        <label className={labelClassName}>Description</label>
        <textarea name="description" rows={2} className={fieldClassName} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClassName}>Track</label>
          <select name="track" required className={fieldClassName}>
            <option value="PUBLIC">Public</option>
            <option value="CLINICIAN">Clinician</option>
          </select>
        </div>
        <div>
          <label className={labelClassName}>Price (cents)</label>
          <input
            name="priceCents"
            type="number"
            min={0}
            defaultValue={0}
            required
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClassName}>Estimated minutes</label>
          <input
            name="estimatedMinutes"
            type="number"
            min={0}
            defaultValue={0}
            required
            className={fieldClassName}
          />
        </div>
        <div>
          <label className={labelClassName}>Sort order</label>
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={0}
            required
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label className={labelClassName}>Instructor</label>
        <select name="instructorId" required className={fieldClassName}>
          <option value="">Select an instructor…</option>
          {instructors.map((instructor) => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.name}
            </option>
          ))}
        </select>
        {instructors.length === 0 ? (
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
        disabled={pending || instructors.length === 0}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create course"}
      </button>

      <p className="font-body text-xs text-[var(--color-ink-muted)]">
        New courses start as a draft. Publish from the course page once its
        modules and lessons are ready.
      </p>

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
