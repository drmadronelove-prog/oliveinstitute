"use server";

import { z } from "zod";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  term: z.string().trim().min(1, "Term is required").max(100),
  credits: z.coerce.number().int().min(0).max(20),
  meetingTimes: z.string().trim().max(200).optional().default(""),
  professorId: z.string().trim().min(1, "Choose an instructor"),
});

export type CreateCourseState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createCourseAction(
  _prevState: CreateCourseState,
  formData: FormData,
): Promise<CreateCourseState> {
  await requireRole(Role.ADMIN);

  const parsed = createCourseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    term: formData.get("term"),
    credits: formData.get("credits"),
    meetingTimes: formData.get("meetingTimes"),
    professorId: formData.get("professorId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const professor = await prisma.user.findUnique({
    where: { id: parsed.data.professorId },
  });
  if (!professor || professor.role !== Role.INSTRUCTOR) {
    return { status: "error", message: "Selected instructor is invalid." };
  }

  await prisma.course.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      term: parsed.data.term,
      credits: parsed.data.credits,
      meetingTimes: parsed.data.meetingTimes,
      professorId: professor.id,
    },
  });

  revalidatePath("/admin/courses");

  return { status: "success", message: `Course "${parsed.data.title}" created.` };
}
