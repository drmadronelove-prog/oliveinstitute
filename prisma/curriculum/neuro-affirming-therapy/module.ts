import { LessonType } from "@prisma/client";
import type { ModuleSeed, QuizSeed } from "../types";

/**
 * Every module of the certificate has the same shape — three hours made of
 * an hour-long lecture, two shorter videos to watch, a handout to read, and
 * a knowledge check — so each module file only supplies the content and
 * this assembles the lessons in the fixed order with the fixed timings.
 */
export const LECTURE_SECONDS = 60 * 60;
export const WATCH_SECONDS = 25 * 60;
export const HANDOUT_SECONDS = 50 * 60;
export const QUIZ_SECONDS = 20 * 60;
export const MODULE_SECONDS =
  LECTURE_SECONDS + 2 * WATCH_SECONDS + HANDOUT_SECONDS + QUIZ_SECONDS;

export type ModuleContent = {
  /** 1-based position in the certificate; becomes the slug prefix. */
  number: number;
  title: string;
  lecture: string;
  /** Exactly two supplementary videos, in viewing order. */
  watch: [string, string];
  handout: { title: string; body: string };
  quiz: QuizSeed;
  /** Marks the handout as the course's free preview. One module only. */
  previewHandout?: boolean;
};

export function defineModule(content: ModuleContent): ModuleSeed {
  const prefix = `m${String(content.number).padStart(2, "0")}`;
  return {
    title: content.title,
    lessons: [
      {
        title: `Lecture: ${content.lecture}`,
        slug: `${prefix}-lecture`,
        type: LessonType.VIDEO,
        durationSeconds: LECTURE_SECONDS,
      },
      {
        title: `Watch: ${content.watch[0]}`,
        slug: `${prefix}-watch-1`,
        type: LessonType.VIDEO,
        durationSeconds: WATCH_SECONDS,
      },
      {
        title: `Watch: ${content.watch[1]}`,
        slug: `${prefix}-watch-2`,
        type: LessonType.VIDEO,
        durationSeconds: WATCH_SECONDS,
      },
      {
        title: `Handout: ${content.handout.title}`,
        slug: `${prefix}-handout`,
        type: LessonType.TEXT,
        durationSeconds: HANDOUT_SECONDS,
        isFreePreview: content.previewHandout ?? false,
        body: content.handout.body,
      },
      {
        title: "Knowledge check",
        slug: `${prefix}-knowledge-check`,
        type: LessonType.QUIZ,
        durationSeconds: QUIZ_SECONDS,
      },
    ],
    quiz: content.quiz,
  };
}

/** Olive Clinical's public site — the handouts link into its posts, tools, and games. */
export const OC = "https://www.oliveclinical.com";
