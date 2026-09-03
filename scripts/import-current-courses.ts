import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Shared initial password for every account this script creates, matching the student rollout. */
const SHARED_PASSWORD = "password123";

/**
 * Professors for the 2026-27 Theravada Studies offerings (from /schedule).
 * Gil Fronsdal's email is real (seen repeatedly as a recommender contact on
 * student applications). Everyone else doesn't have a real email on file
 * anywhere in Drive — these are PLACEHOLDER addresses at saticenter.org and
 * need to be corrected (via /admin/users) before any of them could
 * actually log in.
 */
const PROFESSORS = {
  gil: { name: "Gil Fronsdal", email: "fronsdal@sbcglobal.net" },
  vanessa: { name: "Vanessa Able", email: "vanessa.able@saticenter.org" },
  lydia: { name: "Lydia Ridgway", email: "lydia.ridgway@saticenter.org" },
  yanli: { name: "Yanli Wang", email: "yanli.wang@saticenter.org" },
  thina: { name: "Thina Ollier", email: "thina.ollier@saticenter.org" },
  janel: { name: "Janel Crooks", email: "janel.crooks@saticenter.org" },
  diana: { name: "Diana Clark", email: "diana.clark@saticenter.org" },
} as const;

type ProfessorKey = keyof typeof PROFESSORS;

const COURSES: Array<{
  title: string;
  description: string;
  term: string;
  credits: number;
  meetingTimes: string;
  professor: ProfessorKey;
  /** Additional instructors listed alongside the primary professor above. */
  coProfessors?: ProfessorKey[];
}> = [
  {
    title: "Anukampa Practice Program",
    description:
      "Co-taught with Gil Fronsdal. More information: https://sati.org/chaplaincy/anukampa-practice-program/",
    term: "August 2026 – July 2027",
    credits: 3,
    meetingTimes: "Zoom (specific weekly time not yet published)",
    professor: "vanessa",
    coProfessors: ["gil"],
  },
  {
    title: "Deepening Meditation Program",
    description:
      "An Insight Meditation Center (IMC) program that may be taken for certificate credit. Register through IMC; certificate students receive additional information about receiving Sati Center credit. More information: https://www.insightmeditationcenter.org/special-upcoming-events/#dmp",
    term: "October 2026 – May 2027",
    credits: 3,
    meetingTimes: "Zoom (specific weekly time not yet published)",
    professor: "gil",
  },
  {
    title: "Eightfold Path Program",
    description:
      "Co-taught with Yanli Wang, Thina Ollier, Janel Crooks, and others. An Insight Meditation Center (IMC) program that may be taken for certificate credit. Register through IMC; certificate students receive additional information about receiving Sati Center credit. More information: https://www.insightmeditationcenter.org/special-upcoming-events/",
    term: "October – June",
    credits: 3,
    meetingTimes: "Zoom and in-person (specific weekly time not yet published)",
    professor: "lydia",
    coProfessors: ["yanli", "thina", "janel"],
  },
  {
    title: "Theravada Studies Seminar",
    description:
      "An eight- to nine-month seminar linking several shorter Sati Center programs. Certificate students participate in discussion groups with Gil Fronsdal and guest teachers, including a Theravada Buddhism series with Aleix Ruiz-Falqués (Fridays, October 2, 9, 16 & 23) and sutta study sessions on the Simile of the Cloth, the Brahmanical \"Self\", and the Verses of the Nuns (Therigatha). See /calendar for the full list of individual session dates.",
    term: "August 2026 – June 2027",
    credits: 1,
    meetingTimes:
      "Thursdays 3:30–5:30 PM Pacific (Sutta Study sessions); Fridays 8:00–9:30 AM Pacific in October (Theravada Buddhism series) — see /calendar for exact dates",
    professor: "gil",
  },
  {
    title: "Sutta Study: Middle Length Discourses (Parts A & B)",
    description:
      "Two self-paced systematic courses on the Middle Length Discourses of the Buddha (Majjhima Nikaya), taught by Gil Fronsdal & Diana Clark. Part A (1.5 units): https://courses.sati.org/courses/middle-length-discourses-a — Part B (1.5 units): https://courses.sati.org/courses/middle-length-discourses-b",
    term: "Self-paced",
    credits: 3,
    meetingTimes: "No set meeting times — self-paced online coursework",
    professor: "gil",
    coProfessors: ["diana"],
  },
];

async function upsertProfessor(p: { name: string; email: string }) {
  const email = p.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(SHARED_PASSWORD, 10);
  return prisma.user.create({
    data: { name: p.name, email, role: Role.PROFESSOR, passwordHash },
  });
}

async function main() {
  const professorRecords = {} as Record<ProfessorKey, { id: string }>;
  for (const key of Object.keys(PROFESSORS) as ProfessorKey[]) {
    professorRecords[key] = await upsertProfessor(PROFESSORS[key]);
    console.log(`Professor ready: ${PROFESSORS[key].name} <${PROFESSORS[key].email}>`);
  }

  console.log("\nCourses:\n");
  for (const c of COURSES) {
    const existing = await prisma.course.findFirst({ where: { title: c.title } });
    const data = {
      description: c.description,
      term: c.term,
      credits: c.credits,
      meetingTimes: c.meetingTimes,
      professorId: professorRecords[c.professor].id,
    };

    const course = existing
      ? await prisma.course.update({ where: { id: existing.id }, data })
      : await prisma.course.create({ data: { title: c.title, ...data } });

    const coProfessorIds = (c.coProfessors ?? []).map((key) => professorRecords[key].id);
    await prisma.courseProfessor.deleteMany({
      where: { courseId: course.id, professorId: { notIn: coProfessorIds } },
    });
    for (const professorId of coProfessorIds) {
      await prisma.courseProfessor.upsert({
        where: { courseId_professorId: { courseId: course.id, professorId } },
        update: {},
        create: { courseId: course.id, professorId },
      });
    }

    const allNames = [c.professor, ...(c.coProfessors ?? [])].map((k) => PROFESSORS[k].name);
    console.log(`${existing ? "UPDATED" : "CREATED"}  ${c.title}  (${allNames.join(", ")})`);
  }

  console.log(
    "\nDone. Every professor account besides Gil Fronsdal was created with a placeholder email — fix those in /admin/users before relying on their logins.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
