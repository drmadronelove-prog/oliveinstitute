import { CourseStatus, Track } from "@prisma/client";
import { emailService } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export type RecommendedCourse = { title: string; slug: string };

/**
 * One suggestion for what to take next — a PUBLISHED course on the same
 * track the learner isn't already enrolled in, other than the one they
 * just finished. Null rather than guessing when nothing fits.
 */
export async function findRecommendedNextCourse(
  userId: string,
  track: Track,
  excludeCourseId: string,
): Promise<RecommendedCourse | null> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    select: { courseId: true },
  });
  const excludedIds = [...enrollments.map((e) => e.courseId), excludeCourseId];

  return prisma.course.findFirst({
    where: {
      track,
      status: CourseStatus.PUBLISHED,
      id: { notIn: excludedIds },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { title: true, slug: true },
  });
}

/**
 * Sent once, from markLessonComplete, the same moment a course's last
 * lesson rolls Enrollment.completedAt over and a certificate is issued.
 */
export async function sendCourseCompletionEmail(params: {
  to: string;
  name: string;
  courseTitle: string;
  enrollmentId: string;
  nextCourse: RecommendedCourse | null;
}) {
  const certificateUrl = absoluteUrl(`/certificates/${params.enrollmentId}`);
  const nextCourseLines = params.nextCourse
    ? [
        "",
        `Keep going: ${params.nextCourse.title}`,
        absoluteUrl(`/courses/${params.nextCourse.slug}`),
      ]
    : [];

  await emailService.send({
    to: params.to,
    subject: `You completed ${params.courseTitle}`,
    body: [
      `Hello ${params.name},`,
      "",
      `Congratulations — you've completed ${params.courseTitle}.`,
      "",
      `Your certificate: ${certificateUrl}`,
      ...nextCourseLines,
      "",
      `— ${SITE_NAME}`,
    ].join("\n"),
  });
}
