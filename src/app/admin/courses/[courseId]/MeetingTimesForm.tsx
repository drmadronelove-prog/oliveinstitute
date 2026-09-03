"use client";

import { useActionState } from "react";
import { updateMeetingTimesAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function MeetingTimesForm({
  courseId,
  currentValue,
}: {
  courseId: string;
  currentValue: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateMeetingTimesAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input
        key={currentValue}
        name="meetingTimes"
        type="text"
        defaultValue={currentValue}
        placeholder="Tuesdays &amp; Thursdays, 6:00–7:30 PM"
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-md border border-[var(--color-olive)] px-3 py-2 font-body text-sm text-[var(--color-olive)] transition-colors hover:bg-[var(--color-olive)] hover:text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.status === "success" ? (
        <span className="shrink-0 font-body text-xs text-[var(--color-olive)]">
          Saved
        </span>
      ) : null}
    </form>
  );
}
