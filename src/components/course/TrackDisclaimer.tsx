import type { Track } from "@prisma/client";

/**
 * The standing disclaimer for a course's track. PUBLIC courses get the
 * "this isn't therapy" notice; CLINICIAN courses get the CE notice instead
 * — a course is exactly one track, so exactly one of these ever shows.
 * Rendered persistently (not just once, not behind a dismiss) on every page
 * where a visitor or learner is actually looking at a specific course.
 */
export function TrackDisclaimer({ track }: { track: Track }) {
  const text =
    track === "CLINICIAN"
      ? "This course is educational content for clinicians and is not APA-approved continuing education."
      : "This course is education, not therapy or medical advice. Taking it does not create a clinician-client relationship.";

  return (
    <p
      role="note"
      className="rounded-2xl border-2 border-dashed border-[var(--ink)] px-5 py-3.5 font-body text-base text-[var(--ink)]"
    >
      {text}
    </p>
  );
}
