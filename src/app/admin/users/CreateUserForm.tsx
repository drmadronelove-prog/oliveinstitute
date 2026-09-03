"use client";

import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "./actions";

const initialState: CreateUserState = { status: "idle" };

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Name
        </label>
        <input
          name="name"
          type="text"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <div>
        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <div>
        <label className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]">
          Role
        </label>
        <select
          name="role"
          defaultValue="LEARNER"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        >
          <option value="LEARNER">Learner</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create user"}
      </button>

      {state.status === "error" ? (
        <p className="font-body text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <div className="rounded-md bg-[var(--color-sage)]/10 p-3 font-body text-sm text-[var(--color-ink)]">
          <p className="mb-1 font-medium">
            Account created for {state.createdEmail}.
          </p>
          <p>
            Temporary password:{" "}
            <code className="rounded bg-white px-1.5 py-0.5">
              {state.tempPassword}
            </code>
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            Share this with the user out of band — it won&apos;t be shown
            again. They can change it from Settings after signing in.
          </p>
        </div>
      ) : null}
    </form>
  );
}
