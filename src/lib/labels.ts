export const CREDIT_STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "In progress",
  CREDIT: "Credit",
  NO_CREDIT: "No credit",
  INCOMPLETE: "Incomplete",
};

export const SUBMISSION_GRADE_LABEL: Record<string, string> = {
  PASS: "Pass",
  NO_PASS: "No Pass",
};

/** Joins a course's primary professor and any co-professors into one display string. */
export function formatCourseProfessors(course: {
  professor: { name: string };
  coProfessors: { professor: { name: string } }[];
}): string {
  return [course.professor.name, ...course.coProfessors.map((cp) => cp.professor.name)].join(", ");
}
