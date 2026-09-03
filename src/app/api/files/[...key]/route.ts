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

  // Every stored file is a course material, visible to the course's
  // professor, an admin, or an enrolled student — look the key up rather
  // than trusting the path.
  const material = await prisma.courseMaterial.findFirst({ where: { url } });
  if (!material) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let allowed = role === Role.ADMIN;

  if (!allowed && role === Role.INSTRUCTOR) {
    const course = await prisma.course.findUnique({
      where: { id: material.courseId },
    });
    allowed = course?.professorId === userId;
  }
  if (!allowed && role === Role.LEARNER) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: material.courseId } },
    });
    allowed = enrollment != null;
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
