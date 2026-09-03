"use server";

import { z } from "zod";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { generateTempPassword } from "@/lib/password";

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: z.enum(Role),
});

export type CreateUserState = {
  status: "idle" | "success" | "error";
  message?: string;
  tempPassword?: string;
  createdEmail?: string;
};

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

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.create({
    data: { name, email, role, passwordHash },
  });

  revalidatePath("/admin/users");

  return { status: "success", tempPassword, createdEmail: email };
}

const resetPasswordSchema = z.object({
  userId: z.string().trim().min(1),
});

export type ResetPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
  tempPassword?: string;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  await requireRole(Role.ADMIN);

  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Invalid request." };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return { status: "error", message: "User not found." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  revalidatePath("/admin/users");

  return {
    status: "success",
    tempPassword,
    message: `New temporary password set for ${user.email}.`,
  };
}
