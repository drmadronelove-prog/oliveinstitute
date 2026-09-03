"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markLessonCompleteAction } from "@/app/learn/[courseSlug]/[lessonSlug]/actions";

export function MarkCompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (completed) {
    return (
      <p className="font-body text-sm font-medium text-[var(--color-sage-dark)]">
        ✓ Marked complete
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await markLessonCompleteAction(lessonId);
              setCompleted(true);
              router.refresh();
            } catch {
              setError("Couldn't save that — try again.");
            }
          });
        }}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Mark complete"}
      </button>
      {error ? (
        <p className="mt-2 font-body text-xs text-[var(--color-terracotta)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
