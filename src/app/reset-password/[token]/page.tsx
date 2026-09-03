import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken, isTokenUsable } from "@/lib/tokens";
import { PublicShell } from "@/components/shell/PublicShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Check the token before rendering the form, so a dead link says so up front
  // instead of after the visitor has typed a new password.
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, usedAt: true },
  });
  const usable = row !== null && isTokenUsable(row);

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-md px-6 py-12">
        <div className="rounded-2xl bg-[var(--color-card)] p-8 shadow-sm ring-1 ring-black/5">
          {usable ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-2xl font-semibold text-[var(--color-olive)]">
                That link has expired
              </h1>
              <p className="font-body text-sm text-[var(--color-ink-muted)]">
                Reset links work once and last an hour. Request a new one and
                it will arrive in a moment.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block rounded-md bg-[var(--color-olive)] px-4 py-2.5 text-center font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
              >
                Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
