"use server";

import { z } from "zod";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { emailService } from "@/lib/email";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const sendEmailSchema = z.object({
  recipientId: z.string().trim().min(1),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  body: z.string().trim().min(1, "Message is required").max(10000),
});

export async function sendDirectEmailAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireRole([Role.ADMIN, Role.PROFESSOR]);

  const parsed = sendEmailSchema.safeParse({
    recipientId: formData.get("recipientId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const recipient = await prisma.user.findUnique({
    where: { id: parsed.data.recipientId },
  });
  if (!recipient) {
    return { status: "error", message: "Recipient not found." };
  }

  if (session.user.role === Role.PROFESSOR) {
    const teachesRecipient = await prisma.enrollment.findFirst({
      where: {
        userId: recipient.id,
        status: "ACTIVE",
        course: { professorId: session.user.id },
      },
    });
    if (!teachesRecipient) {
      return {
        status: "error",
        message: "You can only email students enrolled in your courses.",
      };
    }
  }

  await emailService.send({
    to: recipient.email,
    subject: parsed.data.subject,
    body: parsed.data.body,
  });

  await prisma.directEmail.create({
    data: {
      senderId: session.user.id,
      recipientId: recipient.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  });

  revalidatePath("/admin/emails");

  return { status: "success", message: `Email sent to ${recipient.name}.` };
}
