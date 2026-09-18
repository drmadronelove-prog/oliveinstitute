import { describe, expect, it } from "vitest";
import { LessonType } from "@prisma/client";
import {
  NEURO_AFFIRMING_THERAPY_MODULES,
  neuroAffirmingTherapyCertificate,
} from "../../../prisma/curriculum/neuro-affirming-therapy";
import { MODULE_SECONDS } from "../../../prisma/curriculum/neuro-affirming-therapy/module";

/**
 * The certificate is data, not code, but the brief it was built to is
 * precise — fifteen three-hour modules, each with a lecture, videos to
 * watch, a handout, and a quiz — and the seed and the publish gate both
 * make assumptions about its shape. These tests keep the data honest.
 */
describe("Certificate in Neuro-Affirming Therapy curriculum", () => {
  const course = neuroAffirmingTherapyCertificate;
  const modules = NEURO_AFFIRMING_THERAPY_MODULES;
  const lessons = modules.flatMap((m) => m.lessons);

  it("has fifteen modules of three hours each, totalling 45 hours", () => {
    expect(modules).toHaveLength(15);
    expect(MODULE_SECONDS).toBe(3 * 60 * 60);
    for (const courseModule of modules) {
      const seconds = courseModule.lessons.reduce(
        (sum, lesson) => sum + lesson.durationSeconds,
        0,
      );
      expect(seconds, courseModule.title).toBe(MODULE_SECONDS);
    }
    expect(course.estimatedMinutes).toBe(15 * 180);
  });

  it("gives every module a lecture, two videos to watch, a handout, and a quiz", () => {
    for (const courseModule of modules) {
      const types = courseModule.lessons.map((l) => l.type);
      expect(types, courseModule.title).toEqual([
        LessonType.VIDEO,
        LessonType.VIDEO,
        LessonType.VIDEO,
        LessonType.TEXT,
        LessonType.QUIZ,
      ]);
      expect(courseModule.lessons[0].title).toMatch(/^Lecture: /);
      expect(courseModule.lessons[1].title).toMatch(/^Watch: /);
      expect(courseModule.lessons[2].title).toMatch(/^Watch: /);
      expect(courseModule.lessons[3].title).toMatch(/^Handout: /);
      expect(courseModule.quiz, courseModule.title).toBeDefined();
    }
  });

  it("uses lesson slugs that are unique across the whole course", () => {
    // The lesson page looks a lesson up by course + slug, so slugs must not
    // repeat between modules even though the schema only requires
    // uniqueness within one.
    const slugs = lessons.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^m\d{2}-[a-z0-9-]+$/);
  });

  it("marks exactly one lesson as the free preview, and it is a readable handout", () => {
    const previews = lessons.filter((l) => l.isFreePreview);
    expect(previews).toHaveLength(1);
    expect(previews[0].type).toBe(LessonType.TEXT);
    expect(previews[0].body?.length ?? 0).toBeGreaterThan(1000);
  });

  it("gives every handout a cited body with a references list and Olive Clinical links", () => {
    for (const courseModule of modules) {
      const handout = courseModule.lessons[3];
      const body = handout.body ?? "";
      expect(body.length, handout.title).toBeGreaterThan(3000);
      expect(body, handout.title).toContain("## References");
      expect(body, handout.title).toContain("## From oliveclinical.com");
      expect(body, handout.title).toContain("https://www.oliveclinical.com/");
      // At least a dozen in-text citations per handout.
      const citations = body.match(/\((?:[A-Z][A-Za-z'’-]+(?: et al\.)?(?:, | & | and )?)+,? \d{4}[a-z]?\)/g) ?? [];
      expect(citations.length, handout.title).toBeGreaterThanOrEqual(12);
    }
  });

  it("has at least five well-formed questions per knowledge check", () => {
    for (const courseModule of modules) {
      const quiz = courseModule.quiz!;
      expect(quiz.questions.length, quiz.title).toBeGreaterThanOrEqual(5);
      for (const question of quiz.questions) {
        expect(question.options.length, question.prompt).toBeGreaterThanOrEqual(3);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(question.options.length);
        expect(question.explanation.length, question.prompt).toBeGreaterThan(40);
        expect(new Set(question.options).size).toBe(question.options.length);
      }
    }
  });

  it("is seeded as an unpriced DRAFT that keeps an existing curriculum", () => {
    expect(course.status).toBe("DRAFT");
    expect(course.priceCents).toBe(0);
    expect(course.placeholderVideos).toBe(false);
    expect(course.rebuild).toBe("if-empty");
    expect(course.track).toBe("CLINICIAN");
    expect(course.slug).toBe("certificate-in-neuro-affirming-therapy");
  });

  it("orders the brief's topics into modules 2–14 with foundations first and integration last", () => {
    const titles = modules.map((m) => m.title);
    expect(titles[0]).toMatch(/Foundations/);
    expect(titles[14]).toMatch(/Integration/);
    const required = [
      /relationships/i,
      /demand avoidance/i,
      /Assessing/i,
      /Co-occurring/i,
      /Executive functioning/i,
      /Emotion regulation/i,
      /Sensory processing and burnout/i,
      /families/i,
      /history/i,
      /support outside the clinic/i,
      /gender and sexuality/i,
      /Basics of ADHD/,
      /Basics of autism/,
    ];
    for (const pattern of required) {
      expect(titles.some((t) => pattern.test(t)), String(pattern)).toBe(true);
    }
  });
});
