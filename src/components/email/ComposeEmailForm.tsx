"use client";

import { useActionState } from "react";
import { sendDirectEmailAction, type ActionState } from "@/lib/actions/email";

const initialState: ActionState = { status: "idle" };

export function ComposeEmailForm({
  recipientId,
  recipientName,
  recipientEmail,
}: {
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
}) {
  const [state, formAction, pending] = useActionState(
    sendDirectEmailAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="recipientId" value={recipientId} />

      <p className="font-serif text-sm text-[var(--color-ink-muted)]">
        To: <span className="font-medium text-[var(--color-ink)]">{recipientName}</span>{" "}
        &lt;{recipientEmail}&gt;
      </p>

      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Subject
        </label>
        <input
          name="subject"
          type="text"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />
      </div>

      <div>
        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Message
        </label>
        <textarea
          name="body"
          rows={6}
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-[var(--color-forest)] px-4 py-2 font-serif text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send email"}
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
