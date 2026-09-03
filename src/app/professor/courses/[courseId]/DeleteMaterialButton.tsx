"use client";

import { useActionState } from "react";
import { deleteMaterialAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function DeleteMaterialButton({
  courseId,
  materialId,
}: {
  courseId: string;
  materialId: string;
}) {
  const [, formAction, pending] = useActionState(
    deleteMaterialAction,
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="materialId" value={materialId} />
      <button
        type="submit"
        disabled={pending}
        className="font-serif text-xs text-red-700 underline underline-offset-2 disabled:opacity-60"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}
