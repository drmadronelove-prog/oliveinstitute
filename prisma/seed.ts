import {
  CourseStatus,
  LessonType,
  PrismaClient,
  Role,
  Track,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Reads a required environment variable, or aborts. There are no demo
 * accounts and no fallback credentials — an unseeded environment must fail
 * loudly rather than quietly provisioning a guessable admin login.
 */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is not set. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running the seed.`,
    );
  }
  return value;
}

type LessonSeed = {
  title: string;
  slug: string;
  type: LessonType;
  durationSeconds: number;
  isFreePreview?: boolean;
  body?: string;
};

type ModuleSeed = { title: string; lessons: LessonSeed[] };

type CourseSeed = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  track: Track;
  priceCents: number;
  estimatedMinutes: number;
  sortOrder: number;
  modules: ModuleSeed[];
};

/**
 * Two catalogue courses, one per track. Each has two modules and five
 * lessons in total, and its first lesson is the free preview.
 */
const COURSES: CourseSeed[] = [
  {
    slug: "trauma-informed-care-foundations",
    title: "Trauma-Informed Care: Foundations",
    subtitle: "A clinical grounding in trauma-informed practice",
    description:
      "A self-paced foundation in trauma-informed care for practising clinicians: the evidence base, the clinical stance, and how to hold a session when a client is dysregulated.",
    track: Track.CLINICIAN,
    priceCents: 24900,
    estimatedMinutes: 190,
    sortOrder: 1,
    modules: [
      {
        title: "Orientation",
        lessons: [
          {
            title: "What trauma-informed care is, and is not",
            slug: "what-it-is",
            type: LessonType.VIDEO,
            durationSeconds: 840,
            isFreePreview: true,
          },
          {
            title: "The evidence base",
            slug: "evidence-base",
            type: LessonType.VIDEO,
            durationSeconds: 1320,
          },
          {
            title: "Core principles, annotated",
            slug: "core-principles",
            type: LessonType.TEXT,
            durationSeconds: 900,
            body:
              "Safety, trustworthiness, choice, collaboration, and empowerment — what each one asks of you in the room.",
          },
        ],
      },
      {
        title: "In the room",
        lessons: [
          {
            title: "Opening a session",
            slug: "opening-a-session",
            type: LessonType.VIDEO,
            durationSeconds: 1500,
          },
          {
            title: "Knowledge check",
            slug: "knowledge-check",
            type: LessonType.QUIZ,
            durationSeconds: 600,
          },
        ],
      },
    ],
  },
  {
    slug: "steadier-ground",
    title: "Steadier Ground",
    subtitle: "Everyday practices for a calmer nervous system",
    description:
      "A self-paced course for anyone who wants practical, unhurried ways to settle — no clinical background needed, and nothing you have to believe.",
    track: Track.PUBLIC,
    priceCents: 7900,
    estimatedMinutes: 105,
    sortOrder: 2,
    modules: [
      {
        title: "Starting where you are",
        lessons: [
          {
            title: "A first look at settling",
            slug: "first-look",
            type: LessonType.VIDEO,
            durationSeconds: 600,
            isFreePreview: true,
          },
          {
            title: "Noticing without fixing",
            slug: "noticing",
            type: LessonType.VIDEO,
            durationSeconds: 900,
          },
        ],
      },
      {
        title: "Practices",
        lessons: [
          {
            title: "Breath, slowly",
            slug: "breath-slowly",
            type: LessonType.VIDEO,
            durationSeconds: 780,
          },
          {
            title: "A short written practice",
            slug: "written-practice",
            type: LessonType.TEXT,
            durationSeconds: 480,
            body:
              "Ten minutes, a page, and no one else reading it. Prompts you can return to whenever you need them.",
          },
          {
            title: "Reference handout",
            slug: "reference-handout",
            type: LessonType.PDF,
            durationSeconds: 300,
          },
        ],
      },
    ],
  },
];

async function seedCourse(seed: CourseSeed, instructorId: string) {
  const course = await prisma.course.upsert({
    where: { slug: seed.slug },
    update: {
      title: seed.title,
      subtitle: seed.subtitle,
      description: seed.description,
      track: seed.track,
      priceCents: seed.priceCents,
      estimatedMinutes: seed.estimatedMinutes,
      sortOrder: seed.sortOrder,
      instructorId,
    },
    create: {
      slug: seed.slug,
      title: seed.title,
      subtitle: seed.subtitle,
      description: seed.description,
      track: seed.track,
      priceCents: seed.priceCents,
      estimatedMinutes: seed.estimatedMinutes,
      sortOrder: seed.sortOrder,
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
      instructorId,
    },
  });

  // Rebuild the tree each run so re-seeding is idempotent. Modules cascade
  // to lessons, so removing them clears the lessons too.
  await prisma.module.deleteMany({ where: { courseId: course.id } });

  for (const [moduleIndex, moduleSeed] of seed.modules.entries()) {
    const courseModule = await prisma.module.create({
      data: {
        courseId: course.id,
        title: moduleSeed.title,
        sortOrder: moduleIndex + 1,
      },
    });

    for (const [lessonIndex, lesson] of moduleSeed.lessons.entries()) {
      await prisma.lesson.create({
        data: {
          moduleId: courseModule.id,
          title: lesson.title,
          slug: lesson.slug,
          sortOrder: lessonIndex + 1,
          type: lesson.type,
          durationSeconds: lesson.durationSeconds,
          isFreePreview: lesson.isFreePreview ?? false,
          body: lesson.body ?? null,
          videoUid:
            lesson.type === LessonType.VIDEO
              ? `seed-${seed.slug}-${lesson.slug}`
              : null,
        },
      });
    }
  }

  const lessonCount = seed.modules.reduce(
    (total, m) => total + m.lessons.length,
    0,
  );
  console.log(
    `  ${course.slug} — ${seed.track}, ${seed.modules.length} modules, ${lessonCount} lessons`,
  );

  return course;
}

async function main() {
  const email = requireEnv("SEED_ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrator";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.ADMIN },
    create: { name, email, passwordHash, role: Role.ADMIN },
  });

  console.log(`Seeded admin account: ${admin.email}`);

  // The admin owns the seeded catalogue: the seed provisions no other
  // account, and Course.instructorId is required.
  console.log("Seeded courses:");
  for (const seed of COURSES) {
    await seedCourse(seed, admin.id);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
