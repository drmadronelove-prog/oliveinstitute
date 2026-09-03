import { CourseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * The single place any code asks whether someone may see something.
 *
 * Nothing else should reason about enrollments, course status, or free
 * previews to make an access decision — call these instead, so there is one
 * definition of "may see" to audit and change.
 *
 * The rules, in order:
 *
 * - An ADMIN sees everything.
 * - A course's own instructor sees that course, at any status. This is how
 *   a DRAFT gets reviewed before it is published.
 * - Anyone else needs an enrollment, and the course must not be a DRAFT.
 *   ARCHIVED still grants access: archiving retires a course from the
 *   storefront, it does not revoke what people already own.
 * - A lesson flagged `isFreePreview` on a PUBLISHED course is the one thing
 *   visible without an entitlement — it is the course's sample, and the one
 *   case that resolves for a logged-out visitor.
 *
 * `canPurchase` answers the neighbouring question — may they *buy* this? —
 * and lives here for the same reason: one place to audit, one place to
 * change.
 *
 * All three deny by default: an unknown user, course, or lesson is false,
 * never an error.
 */

/** Course statuses whose content an enrolled learner may open. */
const ENROLLED_VISIBLE_STATUSES: CourseStatus[] = [
  CourseStatus.PUBLISHED,
  CourseStatus.ARCHIVED,
];

/** True if `userId` may open the content of `courseId`. */
export async function hasAccess(
  userId: string,
  courseId: string,
): Promise<boolean> {
  if (!userId || !courseId) return false;

  const [user, course] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, instructorId: true },
    }),
  ]);

  if (!user || !course) return false;

  if (user.role === Role.ADMIN) return true;
  if (course.instructorId === user.id) return true;

  if (!ENROLLED_VISIBLE_STATUSES.includes(course.status)) return false;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { id: true },
  });

  return enrollment !== null;
}

/**
 * True if `userId` may open `lessonId` — either because they have access to
 * the course it belongs to, or because it is a free preview of a published
 * course.
 *
 * `userId` is null for a logged-out visitor. Only the free-preview rule can
 * resolve true for them; everything else needs an account, so the storefront
 * can ask this the same way a signed-in page does.
 */
export async function canViewLesson(
  userId: string | null,
  lessonId: string,
): Promise<boolean> {
  if (!lessonId) return false;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      isFreePreview: true,
      module: {
        select: { course: { select: { id: true, status: true } } },
      },
    },
  });

  if (!lesson) return false;

  const course = lesson.module.course;

  if (lesson.isFreePreview && course.status === CourseStatus.PUBLISHED) {
    return true;
  }

  if (!userId) return false;

  return hasAccess(userId, course.id);
}

/** Why a purchase is not available. */
export type PurchaseBlockedReason =
  | "NO_ACCOUNT"
  | "ALREADY_ENROLLED"
  | "NOT_PURCHASABLE"
  | "EMAIL_UNVERIFIED";

export type PurchaseEligibility =
  | { allowed: true }
  | { allowed: false; reason: PurchaseBlockedReason };

/**
 * Whether `userId` may buy `courseId`.
 *
 * An unverified account may sign in and browse — including free previews —
 * but may not complete a purchase, so a mistyped address cannot end up
 * owning a course nobody can reach. The reason comes back with the answer so
 * callers can explain themselves without re-deriving the rule.
 */
export async function canPurchase(
  userId: string | null,
  courseId: string,
): Promise<PurchaseEligibility> {
  if (!userId) return { allowed: false, reason: "NO_ACCOUNT" };

  const [user, course] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, emailVerifiedAt: true },
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true },
    }),
  ]);

  if (!user) return { allowed: false, reason: "NO_ACCOUNT" };
  if (!course) return { allowed: false, reason: "NOT_PURCHASABLE" };

  if (await hasAccess(user.id, course.id)) {
    return { allowed: false, reason: "ALREADY_ENROLLED" };
  }

  if (course.status !== CourseStatus.PUBLISHED) {
    return { allowed: false, reason: "NOT_PURCHASABLE" };
  }

  if (user.emailVerifiedAt === null) {
    return { allowed: false, reason: "EMAIL_UNVERIFIED" };
  }

  return { allowed: true };
}
