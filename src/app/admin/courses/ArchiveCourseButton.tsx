"use client";

import { useActionState } from "react";
import { CourseStatus } from "@prisma/client";
import { updateCourseStatusAction, type CreateCourseState } from "./actions";

const initialState: CreateCourseState = { status: "idle" };

/** A one-click shortcut for the common case — full status control (including un-archiving) still lives on the course detail page. */
export function ArchiveCourseButton({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(
    updateCourseStatusAction,
    initialState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="status" value={CourseStatus.ARCHIVED} />
      <button
        type="submit"
        disabled={pending}
        className="font-body text-xs text-[var(--color-terracotta)] underline underline-offset-2 disabled:opacity-60"
      >
        {pending ? "Archiving…" : "Archive"}
      </button>
      {state.status === "error" ? (
        <span className="ml-2 font-body text-xs text-red-700">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
