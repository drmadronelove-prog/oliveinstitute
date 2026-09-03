import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;

  if (key.length < 2 || key.some((segment) => segment.includes("..") || segment.includes("/"))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { role, id: userId } = session.user;

  const url = `/api/files/${key.join("/")}`;

  // A file is either a course material (visible to the whole class) or a
  // submission attachment (visible only to its author + the course's
  // professor + admins) — look up which, rather than trusting the path.
  const [material, submission] = await Promise.all([
    prisma.courseMaterial.findFirst({ where: { url } }),
    prisma.submission.findFirst({
      where: { fileUrl: url },
      include: { assignment: { select: { courseId: true } } },
    }),
  ]);

  let courseId: string | null = null;
  let allowed = role === Role.ADMIN;

  if (material) {
    courseId = material.courseId;
    if (!allowed && role === Role.PROFESSOR) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      allowed = course?.professorId === userId;
    }
    if (!allowed && role === Role.STUDENT) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      allowed = enrollment?.status === "ACTIVE";
    }
  } else if (submission) {
    courseId = submission.assignment.courseId;
    if (!allowed && role === Role.STUDENT) {
      allowed = submission.studentId === userId;
    }
    if (!allowed && role === Role.PROFESSOR) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      allowed = course?.professorId === userId;
    }
  } else {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const relativePath = path.join(...key);
  const fullPath = path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, relativePath);
  const resolvedUploadsDir = path.resolve(/*turbopackIgnore: true*/ UPLOADS_DIR);
  if (!path.resolve(fullPath).startsWith(resolvedUploadsDir)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = EXTENSION_CONTENT_TYPES[ext] ?? "application/octet-stream";
    const filename = key[key.length - 1];

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
