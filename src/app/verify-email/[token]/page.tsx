import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken, isTokenUsable } from "@/lib/tokens";
import { PublicShell } from "@/components/shell/PublicShell";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

type Outcome = "verified" | "already" | "invalid";

/**
 * Redeems a verification token. Single use: the row is stamped `usedAt` in the
 * same transaction that stamps the user, so a replayed link cannot re-verify
 * an address that was later changed.
 */
async function redeem(rawToken: string): Promise<Outcome> {
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { id: true, emailVerifiedAt: true } } },
  });

  if (!row) return "invalid";
  if (row.user.emailVerifiedAt) return "already";
  if (!isTokenUsable(row)) return "invalid";

  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: now },
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: now },
    }),
    // Any other outstanding links for this user are now moot.
    prisma.emailVerificationToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);

  return "verified";
}

const COPY: Record<Outcome, { title: string; body: string }> = {
  verified: {
    title: "Email confirmed",
    body: "Thanks — your address is confirmed. You can buy courses now.",
  },
  already: {
    title: "Already confirmed",
    body: "This address was already confirmed. Nothing more to do.",
  },
  invalid: {
    title: "That link didn't work",
    body: "It may have expired or already been used. Sign in and request a new confirmation email from your settings.",
  },
};

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const outcome = await redeem(token);
  const copy = COPY[outcome];

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-md px-6 py-16">
        <div className="rounded-2xl bg-[var(--color-card)] p-8 shadow-sm ring-1 ring-black/5">
          <h1 className="mb-2 font-heading text-2xl font-semibold text-[var(--color-olive)]">
            {copy.title}
          </h1>
          <p className="mb-6 font-body text-sm text-[var(--color-ink-muted)]">
            {copy.body}
          </p>
          <Link
            href={outcome === "invalid" ? "/login" : "/dashboard"}
            className="inline-block rounded-md bg-[var(--color-olive)] px-4 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
          >
            {outcome === "invalid" ? "Go to sign in" : "Go to my courses"}
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
