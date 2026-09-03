import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

export async function requireSession() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowed: Role | Role[]) {
  const session = await requireSession();
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(session.user.role)) {
    redirect("/forbidden");
  }
  return session;
}

/** Admins can manage any course; instructors only the ones they own. */
export function canManageCourse(
  session: { user: { id: string; role: Role } },
  course: { instructorId: string },
) {
  return session.user.role === Role.ADMIN || course.instructorId === session.user.id;
}
