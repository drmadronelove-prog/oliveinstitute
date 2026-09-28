"use client";

import { useActionState } from "react";
import {
  addCourseInstructorAction,
  removeCourseInstructorAction,
  type ActionState,
} from "./actions";

const initialState: ActionState = { status: "idle" };

type Person = { id: string; name: string };

/**
 * A course's instructors, as a flat list of equals: each row can be
 * removed, and anyone eligible who isn't already listed can be added.
 * This replaced a single "reassign instructor" dropdown.
 */
export function CourseInstructorsPanel({
  courseId,
  instructors,
  candidates,
}: {
  courseId: string;
  instructors: Person[];
  /** Everyone who may teach — already filtered to those not yet listed. */
  candidates: Person[];
}) {
  const [addState, addAction, adding] = useActionState(
    addCourseInstructorAction,
    initialState,
  );
  const [removeState, removeAction, removing] = useActionState(
    removeCourseInstructorAction,
    initialState,
  );

  return (
    <div className="flex flex-col gap-4">
      {instructors.length === 0 ? (
        <p className="font-body text-sm text-[var(--muted)]">
          Nobody is teaching this course yet. It can&apos;t be published until
          someone is.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {instructors.map((instructor) => (
            <li
              key={instructor.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-[var(--linen)] px-3 py-2"
            >
              <span className="font-body text-sm text-[var(--color-ink)]">
                {instructor.name}
              </span>
              <form action={removeAction}>
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="userId" value={instructor.id} />
                <button
                  type="submit"
                  disabled={removing}
                  className="font-body text-xs text-red-700 underline underline-offset-2 disabled:opacity-60"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {candidates.length > 0 ? (
        <form action={addAction} className="flex items-center gap-3">
          <input type="hidden" name="courseId" value={courseId} />
          <label htmlFor="add-course-instructor" className="sr-only">
            Add an instructor
          </label>
          <select
            id="add-course-instructor"
            name="userId"
            defaultValue=""
            className="rounded-lg border-[1.5px] border-[var(--ink)] bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
          >
            <option value="" disabled>
              Add someone…
            </option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding}
            className="btn-pop rounded-xl border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 font-body text-sm text-[var(--ink)] hover:bg-white disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </form>
      ) : (
        <p className="font-body text-xs text-[var(--color-ink-muted)]">
          Everyone who can teach is already on this course.
        </p>
      )}

      {[addState, removeState].map((state, index) =>
        state.status === "error" ? (
          <p key={index} className="font-body text-xs text-red-700">
            {state.message}
          </p>
        ) : state.status === "success" ? (
          <p key={index} className="font-body text-xs text-[var(--color-olive)]">
            {state.message}
          </p>
        ) : null,
      )}
    </div>
  );
}
