"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/password";
import { hashToken, isTokenUsable } from "@/lib/tokens";

const schema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(1, "Choose a password"),
});

export type ResetPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!row || !isTokenUsable(row)) {
    return {
      status: "error",
      message: "That reset link has expired or already been used.",
    };
  }

  const weak = validatePassword(parsed.data.password, {
    name: row.user.name,
    email: row.user.email,
  });
  if (weak) {
    return { status: "error", message: weak };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    // Single use, and every other outstanding link for this user dies with it.
    prisma.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);

  return {
    status: "success",
    message: "Password updated. You can sign in with it now.",
  };
}
