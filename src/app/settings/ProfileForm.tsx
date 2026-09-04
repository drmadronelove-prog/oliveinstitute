"use client";

import { useActionState } from "react";
import { updateProfileAction, type SettingsState } from "./actions";

const initialState: SettingsState = { status: "idle" };

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="settings-name"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Name
        </label>
        <input
          id="settings-name"
          name="name"
          type="text"
          required
          defaultValue={name}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <div>
        <label
          htmlFor="settings-email"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Email
        </label>
        <input
          id="settings-email"
          type="email"
          value={email}
          readOnly
          disabled
          className="w-full rounded-md border border-black/10 bg-[var(--color-sage-pale)] px-3 py-2 font-body text-sm text-[var(--color-ink-muted)]"
        />
        <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
          Contact an administrator to change your email address.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
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
