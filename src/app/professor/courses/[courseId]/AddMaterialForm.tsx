"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addMaterialAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function AddMaterialForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(
    addMaterialAction,
    initialState,
  );
  const [type, setType] = useState<"PDF" | "LINK" | "VIDEO">("PDF");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      // Reset the native form (clears the file input, which can't be
      // cleared via React state) and the controlled type select together.
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local UI state to the just-reset native form, not an external system
      setType("PDF");
    }
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="flex flex-col gap-4">
      <input type="hidden" name="courseId" value={courseId} />

      <div>
        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Type
        </label>
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as typeof type)}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        >
          <option value="PDF">PDF</option>
          <option value="LINK">Web link</option>
          <option value="VIDEO">Video URL</option>
        </select>
      </div>

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

      {type === "PDF" ? (
        <div>
          <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
            PDF file
          </label>
          <input
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)]"
          />
          <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
            Up to 15 MB.
          </p>
        </div>
      ) : (
        <div>
          <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
            {type === "VIDEO" ? "Video URL" : "Link URL"}
          </label>
          <input
            name="url"
            type="url"
            placeholder="https://…"
            required
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add material"}
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
