import type { CourseStatus, LessonType, Track } from "@prisma/client";

/**
 * The shapes prisma/seed.ts builds a course from. Kept in their own module
 * so a curriculum can be defined (and unit-tested) without touching the
 * database client.
 */

export type QuizQuestionSeed = {
  prompt: string;
  /** Exactly the strings shown to the learner, in order. */
  options: string[];
  /** Index into `options` of the right answer. */
  correctIndex: number;
  /** Shown after any answer, right or wrong. */
  explanation: string;
};

export type QuizSeed = {
  title: string;
  questions: QuizQuestionSeed[];
};

export type LessonSeed = {
  title: string;
  slug: string;
  type: LessonType;
  durationSeconds: number;
  isFreePreview?: boolean;
  /** Markdown, for TEXT lessons. */
  body?: string;
};

export type ModuleSeed = {
  title: string;
  lessons: LessonSeed[];
  /** One knowledge check per module; reached through the module's QUIZ lesson. */
  quiz?: QuizSeed;
};

export type CourseSeed = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  track: Track;
  priceCents: number;
  estimatedMinutes: number;
  sortOrder: number;
  /** Status a *new* course is created with. Re-seeding never changes status. */
  status: CourseStatus;
  /**
   * Whether VIDEO lessons get a fake `seed-…` videoUid. True for the sample
   * catalogue (its players need *something* to point at); false for a real
   * course, whose lectures are uploaded through the admin editor.
   */
  placeholderVideos: boolean;
  /**
   * "always": drop and recreate the module tree on every seed run (the
   * sample courses — the e2e suite relies on them being exactly as defined).
   * "if-empty": build it only when the course has no modules yet, so a
   * re-run never wipes uploaded videos, admin edits, or learner progress.
   * SEED_REBUILD_CURRICULUM=1 forces a rebuild of "if-empty" courses too.
   */
  rebuild: "always" | "if-empty";
  modules: ModuleSeed[];
};
