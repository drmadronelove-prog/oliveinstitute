"use client";

import { useActionState } from "react";
import { saveAttendanceAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

const STATUS_OPTIONS: Array<{ value: "PRESENT" | "ABSENT" | "EXCUSED"; label: string }> = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED", label: "Excused" },
];

export function AttendanceForm({
  courseId,
  sessionDate,
  roster,
}: {
  courseId: string;
  sessionDate: string;
  roster: Array<{ studentId: string; name: string; currentStatus: string | null }>;
}) {
  const [state, formAction, pending] = useActionState(
    saveAttendanceAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="sessionDate" value={sessionDate} />

      <div className="overflow-x-auto">
      <table className="w-full text-left font-serif text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
            <th className="py-2 pr-4">Student</th>
            {STATUS_OPTIONS.map((option) => (
              <th key={option.value} className="py-2 pr-4 text-center">
                {option.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roster.map((entry) => (
            <tr
              key={`${entry.studentId}-${entry.currentStatus}`}
              className="border-b border-black/5 last:border-0"
            >
              <td className="py-2 pr-4">{entry.name}</td>
              {STATUS_OPTIONS.map((option) => (
                <td key={option.value} className="py-2 pr-4 text-center">
                  <input
                    type="radio"
                    name={`status_${entry.studentId}`}
                    value={option.value}
                    defaultChecked={
                      entry.currentStatus
                        ? entry.currentStatus === option.value
                        : option.value === "PRESENT"
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-[var(--color-forest)] px-4 py-2 font-serif text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save attendance"}
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
