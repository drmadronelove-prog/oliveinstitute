"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/rbac";
import { createToken, EMAIL_VERIFICATION_TTL_MS } from "@/lib/tokens";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/authEmails";

export type SettingsState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(200),
});

/**
 * Name only. Changing the email address would have to re-run verification and
 * re-point every reset link, so it is deliberately not a field here yet.
 */
export async function updateProfileAction(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/settings");

  return { status: "success", message: "Profile updated." };
}

export async function resendVerificationAction(): Promise<SettingsState> {
  const session = await requireSession();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerifiedAt: true },
  });

  if (user.emailVerifiedAt) {
    return { status: "success", message: "Your email is already confirmed." };
  }

  // Same budget as registration: this also sends mail to an address.
  const limited = await checkAuthRateLimit("register", user.email);
  if (limited) {
    return { status: "error", message: limited };
  }

  const { token, tokenHash } = createToken();

  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    }),
  ]);

  await sendVerificationEmail({ to: user.email, name: user.name, token });

  return { status: "success", message: "Confirmation email sent." };
}
