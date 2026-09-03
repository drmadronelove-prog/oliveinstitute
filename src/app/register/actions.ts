"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/password";
import { createToken, EMAIL_VERIFICATION_TTL_MS } from "@/lib/tokens";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmail } from "@/lib/authEmails";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Choose a password"),
  acceptTerms: z.literal("on", {
    message: "You must accept the terms of service",
  }),
  acceptPrivacy: z.literal("on", {
    message: "You must accept the privacy policy",
  }),
});

export type RegisterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    acceptTerms: formData.get("acceptTerms"),
    acceptPrivacy: formData.get("acceptPrivacy"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { name, email, password } = parsed.data;

  const limited = await checkAuthRateLimit("register", email);
  if (limited) {
    return { status: "error", message: limited };
  }

  // The server is the authority on strength; the meter in the form is a hint.
  const weak = validatePassword(password, { name, email });
  if (weak) {
    return { status: "error", message: weak };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  // Don't confirm whether an address is already registered. Someone who owns
  // the address still learns the truth from their inbox; someone probing does
  // not. The rate limit above is what stops the probing being cheap.
  if (existing) {
    return {
      status: "success",
      message:
        "Check your email — if that address isn't already registered, a confirmation link is on its way.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  const { token, tokenHash } = createToken();

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      // Self-registration always creates a learner. Anything more is an
      // admin's decision, not a form field.
      role: Role.LEARNER,
      termsAcceptedAt: now,
      emailVerificationTokens: {
        create: {
          tokenHash,
          expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
        },
      },
    },
  });

  await sendVerificationEmail({ to: email, name, token });

  return {
    status: "success",
    message:
      "Check your email — if that address isn't already registered, a confirmation link is on its way.",
  };
}
