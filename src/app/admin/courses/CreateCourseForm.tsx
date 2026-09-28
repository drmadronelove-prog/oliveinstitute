"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createCourseAction, type CreateCourseState } from "./actions";

const initialState: CreateCourseState = { status: "idle" };

const fieldClassName =
  "w-full rounded-lg border-[1.5px] border-[var(--ink)] bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]";
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
        <label htmlFor="create-course-title" className={labelClassName}>
          Title
        </label>
        <input
          id="create-course-title"
          name="title"
          type="text"
          required
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="create-course-slug" className={labelClassName}>
          Slug
        </label>
        <input
          id="create-course-slug"
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
        <label htmlFor="create-course-subtitle" className={labelClassName}>
          Subtitle
        </label>
        <input
          id="create-course-subtitle"
          name="subtitle"
          type="text"
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="create-course-description" className={labelClassName}>
          Description
        </label>
        <textarea
          id="create-course-description"
          name="description"
          rows={2}
          className={fieldClassName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="create-course-track" className={labelClassName}>
            Track
          </label>
          <select
            id="create-course-track"
            name="track"
            required
            className={fieldClassName}
          >
            <option value="PUBLIC">Public</option>
            <option value="CLINICIAN">Clinician</option>
          </select>
        </div>
        <div>
          <label htmlFor="create-course-price" className={labelClassName}>
            Price (cents)
          </label>
          <input
            id="create-course-price"
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
          <label htmlFor="create-course-minutes" className={labelClassName}>
            Estimated minutes
          </label>
          <input
            id="create-course-minutes"
            name="estimatedMinutes"
            type="number"
            min={0}
            defaultValue={0}
            required
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="create-course-sort" className={labelClassName}>
            Sort order
          </label>
          <input
            id="create-course-sort"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={0}
            required
            className={fieldClassName}
          />
        </div>
      </div>

      {/* Checkboxes rather than a multi-select: a course can be taught by
          several people, and a <select multiple> hides that you can pick
          more than one (and needs a modifier key to do it). */}
      <fieldset>
        <legend className={labelClassName}>Instructors</legend>
        {instructors.length === 0 ? (
          <p className="font-body text-xs text-[var(--color-ink-muted)]">
            No accounts can teach yet — create an instructor from{" "}
            <Link href="/admin/users" className="underline underline-offset-2">
              Manage users
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {instructors.map((instructor) => (
              <label
                key={instructor.id}
                htmlFor={`create-course-instructor-${instructor.id}`}
                className="flex items-center gap-2 font-body text-sm text-[var(--color-ink)]"
              >
                <input
                  type="checkbox"
                  id={`create-course-instructor-${instructor.id}`}
                  name="instructorIds"
                  value={instructor.id}
                  className="h-4 w-4"
                />
                {instructor.name}
              </label>
            ))}
          </div>
        )}
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          You can leave this empty for now and add instructors later — a
          course just can&apos;t be published without at least one.
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="btn-pop rounded-xl bg-[var(--plum)] px-4 py-2 font-body text-sm font-medium text-[var(--paper)] hover:bg-[var(--color-terracotta-dark)] disabled:opacity-60"
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
