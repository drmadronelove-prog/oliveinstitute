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

/**
 * Admins can manage any course; an instructor can manage any course they
 * are listed on. A course carries a flat list of instructors — there is no
 * owner among them, so every one of them gets the same rights here.
 *
 * The caller has to have selected `instructors: { select: { userId: true } }`,
 * which is deliberate: a course fetched without them cannot be silently
 * treated as having none.
 */
export function canManageCourse(
  session: { user: { id: string; role: Role } },
  course: { instructors: { userId: string }[] },
) {
  return (
    session.user.role === Role.ADMIN ||
    course.instructors.some((entry) => entry.userId === session.user.id)
  );
}
