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

const deleteUserSchema = z.object({ userId: z.string().trim().min(1) });

export type DeleteUserState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Deletes an account, along with the things that exist only to serve it:
 * enrollments, lesson progress, and any outstanding reset/verification
 * tokens (those cascade in the schema).
 *
 * It refuses rather than cascading in four cases, each of which would
 * destroy something the admin would want back:
 *
 * - **Yourself.** Locking yourself out of your own admin is never what
 *   you meant to click.
 * - **The last admin.** Same failure, one step removed — with nobody left
 *   holding ADMIN, nothing in /admin can be reached again.
 * - **Anyone who teaches a course.** Remove them from the course first,
 *   deliberately, so a course is never silently left unattributed. The
 *   database enforces this too: `course_instructors.userId` is RESTRICT,
 *   not CASCADE.
 * - **Anyone with a purchase.** That row is the record of a real sale,
 *   and refunds are matched against it. It outlives the account.
 *
 * Uploaded lesson resources block deletion for the same reason as courses:
 * the file stays on the lesson and the row records who put it there.
 */
export async function deleteUserAction(
  _prevState: DeleteUserState,
  formData: FormData,
): Promise<DeleteUserState> {
  const session = await requireRole(Role.ADMIN);

  const parsed = deleteUserSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const { userId } = parsed.data;

  if (userId === session.user.id) {
    return { status: "error", message: "You can't delete your own account." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      _count: {
        select: {
          coursesTaught: true,
          purchases: true,
          uploadedResources: true,
          enrollments: true,
        },
      },
    },
  });
  if (!user) {
    return { status: "error", message: "User not found." };
  }

  if (user.role === Role.ADMIN) {
    const admins = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (admins <= 1) {
      return {
        status: "error",
        message: "That's the only admin account — promote someone else first.",
      };
    }
  }

  const blockers: string[] = [];
  if (user._count.coursesTaught > 0) {
    blockers.push(
      `they teach ${user._count.coursesTaught} course${user._count.coursesTaught === 1 ? "" : "s"} — remove them from it on the course page first`,
    );
  }
  if (user._count.purchases > 0) {
    blockers.push(
      `they have ${user._count.purchases} purchase${user._count.purchases === 1 ? "" : "s"}, which is the record of a real sale and can't be deleted`,
    );
  }
  if (user._count.uploadedResources > 0) {
    blockers.push(
      `they uploaded ${user._count.uploadedResources} lesson resource${user._count.uploadedResources === 1 ? "" : "s"} that are still attached to lessons`,
    );
  }
  if (blockers.length > 0) {
    return {
      status: "error",
      message: `Can't delete ${user.name} — ${blockers.join("; and ")}.`,
    };
  }

  // Enrollments and progress exist only to serve this account, so they go
  // with it. Tokens cascade in the schema.
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({ where: { userId } }),
    prisma.enrollment.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/admin/users");
  revalidatePath("/admin/learners");

  return {
    status: "success",
    message: `Deleted ${user.name}${user._count.enrollments > 0 ? ` and ${user._count.enrollments} enrollment${user._count.enrollments === 1 ? "" : "s"}` : ""}.`,
  };
}
