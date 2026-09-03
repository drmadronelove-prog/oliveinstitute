"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/shell/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-[var(--color-card)] p-8 shadow-sm ring-1 ring-black/5"
      >
        <div className="mb-6 flex items-center gap-3">
          <Logo size={40} />
          <div className="leading-tight">
            <p className="font-serif text-lg font-semibold text-[var(--color-forest)]">
              Sati Center
            </p>
            <p className="font-serif text-xs italic text-[var(--color-ink-muted)]">
              for Buddhist Studies
            </p>
          </div>
        </div>

        <h1 className="mb-6 font-heading text-xl font-semibold text-[var(--color-ink)]">
          Sign in
        </h1>

        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mb-4 w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />

        <label className="mb-1 block font-serif text-sm font-medium text-[var(--color-ink)]">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-6 w-full rounded-md border border-black/10 bg-white px-3 py-2 font-serif text-sm text-[var(--color-ink)] focus:outline-2 focus:outline-[var(--color-slate-blue)]"
        />

        {error ? (
          <p className="mb-4 font-serif text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[var(--color-forest)] px-4 py-2 font-serif text-sm font-medium text-white transition-colors hover:bg-[var(--color-forest-dark)] disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
