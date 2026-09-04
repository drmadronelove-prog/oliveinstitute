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
        <label
          htmlFor="create-user-name"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Name
        </label>
        <input
          id="create-user-name"
          name="name"
          type="text"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <div>
        <label
          htmlFor="create-user-email"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Email
        </label>
        <input
          id="create-user-email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]"
        />
      </div>

      <div>
        <label
          htmlFor="create-user-role"
          className="mb-1 block font-body text-sm font-medium text-[var(--color-ink)]"
        >
          Role
        </label>
        <select
          id="create-user-role"
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
        {pending ? "Sending invitation…" : "Create user"}
      </button>

      {state.status === "error" ? (
        <p className="font-body text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p className="rounded-md bg-[var(--color-sage)]/10 p-3 font-body text-sm text-[var(--color-ink)]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
