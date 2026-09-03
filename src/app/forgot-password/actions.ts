"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createToken, PASSWORD_RESET_TTL_MS } from "@/lib/tokens";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/authEmails";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export type ForgotPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/** Shown whether or not the address exists, so the form can't enumerate accounts. */
const NEUTRAL_RESULT =
  "If that address has an account, a reset link is on its way. It expires in an hour.";

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { email } = parsed.data;

  const limited = await checkAuthRateLimit("password-reset", email);
  if (limited) {
    return { status: "error", message: limited };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    const { token, tokenHash } = createToken();

    // Retire any outstanding links, so the newest email is the only one that
    // works and an old one in an inbox is inert.
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
    });
  }

  return { status: "success", message: NEUTRAL_RESULT };
}
