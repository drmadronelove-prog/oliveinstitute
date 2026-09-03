"use server";

import { z } from "zod";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createToken, PASSWORD_RESET_TTL_MS } from "@/lib/tokens";
import { sendAccountInviteEmail, sendPasswordResetEmail } from "@/lib/authEmails";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: z.enum(Role),
});

export type CreateUserState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Placeholder hash for an account whose owner has not chosen a password yet.
 * Random and never shown, so the account cannot be signed into until the
 * invitee follows their emailed link — there is no temporary password to
 * leak, forward, or forget to change.
 */
async function unusablePasswordHash(): Promise<string> {
  return bcrypt.hash(randomBytes(32).toString("base64url"), 10);
}

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireRole(Role.ADMIN);

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { name, email, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { status: "error", message: "A user with that email already exists." };
  }

  const { token, tokenHash } = createToken();

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: await unusablePasswordHash(),
      passwordResetTokens: {
        create: {
          tokenHash,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      },
    },
  });

  await sendAccountInviteEmail({ to: email, name, token });

  revalidatePath("/admin/users");

  return {
    status: "success",
    message: `Invited ${email}. They'll set their own password from the emailed link.`,
  };
}

const sendResetSchema = z.object({
  userId: z.string().trim().min(1),
});

export type SendResetState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Emails the user a reset link. Replaces the old "generate a temporary
 * password and read it back to the admin" flow: an admin can get someone
 * back into their account without ever handling their password.
 */
export async function sendPasswordResetForUserAction(
  _prevState: SendResetState,
  formData: FormData,
): Promise<SendResetState> {
  await requireRole(Role.ADMIN);

  const parsed = sendResetSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    return { status: "error", message: "User not found." };
  }

  const { token, tokenHash } = createToken();

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

  return { status: "success", message: `Reset link sent to ${user.email}.` };
}
