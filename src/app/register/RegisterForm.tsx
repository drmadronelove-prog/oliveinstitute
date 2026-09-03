"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  assessPasswordStrength,
  MIN_PASSWORD_SCORE,
  type PasswordAssessment,
} from "@/lib/password";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = { status: "idle" };

const fieldClassName =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 font-body text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-olive)]";
const labelClassName =
  "mb-1 block font-body text-sm font-medium text-[var(--color-ink)]";

const METER_COLORS = [
  "bg-red-600",
  "bg-red-500",
  "bg-[var(--color-gold)]",
  "bg-[var(--color-sage)]",
  "bg-[var(--color-olive)]",
];

function StrengthMeter({ assessment }: { assessment: PasswordAssessment }) {
  return (
    <div className="mt-2">
      <div
        className="flex gap-1"
        role="meter"
        aria-valuenow={assessment.score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Password strength"
      >
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index < assessment.score
                ? METER_COLORS[assessment.score]
                : "bg-black/10"
            }`}
          />
        ))}
      </div>
      <p
        className={`mt-1 font-body text-xs ${
          assessment.score >= MIN_PASSWORD_SCORE
            ? "text-[var(--color-olive)]"
            : "text-[var(--color-ink-muted)]"
        }`}
      >
        {assessment.label}
        {assessment.issues.length > 0 ? ` — ${assessment.issues[0]}` : ""}
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const assessment = assessPasswordStrength(password, { name, email });

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold text-[var(--color-olive)]">
          Almost there
        </h1>
        <p className="font-body text-sm text-[var(--color-ink-muted)]">
          {state.message}
        </p>
        <Link
          href="/login"
          className="font-body text-sm text-[var(--color-olive)] underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold text-[var(--color-olive)]">
        Create your account
      </h1>

      <div>
        <label htmlFor="name" className={labelClassName}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClassName}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClassName}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClassName}
        />
        {password.length > 0 ? (
          <StrengthMeter assessment={assessment} />
        ) : (
          <p className="mt-1 font-body text-xs text-[var(--color-ink-muted)]">
            At least 10 characters, with a mix of character types.
          </p>
        )}
      </div>

      <label className="flex items-start gap-2">
        <input
          name="acceptTerms"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-olive)]"
        />
        <span className="font-body text-sm text-[var(--color-ink-muted)]">
          I accept the{" "}
          <Link
            href="/terms"
            target="_blank"
            className="text-[var(--color-olive)] underline underline-offset-2"
          >
            terms of service
          </Link>
          .
        </span>
      </label>

      <label className="flex items-start gap-2">
        <input
          name="acceptPrivacy"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-olive)]"
        />
        <span className="font-body text-sm text-[var(--color-ink-muted)]">
          I have read the{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="text-[var(--color-olive)] underline underline-offset-2"
          >
            privacy policy
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--color-olive)] px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)] disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      {state.status === "error" ? (
        <p className="font-body text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      <p className="font-body text-sm text-[var(--color-ink-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--color-olive)] underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
