import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { formatCourseProfessors } from "@/lib/labels";

const THERAVADA_OFFERINGS = [
  {
    title: "Anukampa Practice Program",
    units: "3 units",
    meta: "August 2026–July 2027 · Zoom · Vanessa Able & Gil Fronsdal",
    href: "https://sati.org/chaplaincy/anukampa-practice-program/",
  },
  {
    title: "Deepening Meditation Program",
    units: "3 units",
    meta: "October 2026–May 2027 · Zoom · Gil Fronsdal",
    note: "This Insight Meditation Center (IMC) program may be taken for certificate credit. Register through IMC; certificate students will receive additional information about receiving Sati Center credit.",
    href: "https://www.insightmeditationcenter.org/special-upcoming-events/#dmp",
  },
  {
    title: "Eightfold Path Program",
    units: "3 units",
    meta: "October–June · Zoom and in-person · Lydia Ridgway, Yanli Wang, Thina Ollier, Janel Crooks, and others",
    note: "This Insight Meditation Center (IMC) program may be taken for certificate credit. Register through IMC; certificate students will receive additional information about receiving Sati Center credit.",
    href: "https://www.insightmeditationcenter.org/special-upcoming-events/",
  },
  {
    title: "Theravāda Studies Seminar",
    units: "1 unit",
    meta: "August 2026–June 2027 · Zoom · Supervised by Gil Fronsdal",
    note: "An eight- to nine-month seminar linking several shorter Sati Center programs. Certificate students participate in discussion groups with Gil Fronsdal and guest teachers.",
    seminars: [
      {
        title: "Sutta Study: The Naturalistic Teachings of the Simile of the Cloth — Gil Fronsdal",
        when: "Thursday, August 20 @ 3:30–4:30 p.m. Pacific · Certificate Discussion: 4:30–5:30 p.m. Pacific",
        href: "https://sati.org/event/the-naturalistic-teachings-of-the-buddha/",
      },
      {
        title: "Theravāda Buddhism — Aleix Ruiz-Falqués",
        when: "Fridays, October 2, 9, 16 & 23 @ 8:00–9:30 a.m. Pacific. An introduction to the history of Theravāda Buddhism by one of today's leading Pāli scholars.",
        href: "https://sati.org/series/theravada-buddhism-with-dr-aleix-ruiz-falques/",
      },
      {
        title: "Sutta Study: The Buddha's Critique of the Brahmanical \"Self\" — Gil Fronsdal",
        when: "Thursday, October 29 @ 3:30–4:30 p.m. Pacific · Certificate Discussion: 4:30–5:30 p.m. Pacific",
        href: "https://sati.org/event/buddhas-experiential-alternative-to-the-brahmanical-self/",
      },
      {
        title: "The Verses of the Nuns (Therīgāthā) — Gil Fronsdal",
        when: "5 Week Course: Thursdays, October 15, 22, 29, November 5, 12 @ 3:30–4:30 p.m. Pacific · Certificate Discussion: 4:30–5:30 p.m. Pacific",
        href: "https://sati.org/series/therigatha-the-poetry-of-the-enlightened-nuns/",
      },
    ],
  },
];

const SUTTA_STUDY_COURSES = [
  {
    title: "Exploring the Buddha's Middle Length Discourses – Part A (1.5 units)",
    href: "https://courses.sati.org/courses/middle-length-discourses-a",
  },
  {
    title: "Exploring the Buddha's Middle Length Discourses – Part B (1.5 units)",
    href: "https://courses.sati.org/courses/middle-length-discourses-b",
  },
];

export default async function SchedulePage() {
  await requireSession();

  const courses = await prisma.course.findMany({
    orderBy: [{ term: "asc" }, { title: "asc" }],
    include: {
      professor: { select: { name: true } },
      coProfessors: { include: { professor: { select: { name: true } } } },
    },
  });

  return (
    <AppShell activeHref="/schedule">
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        Class Schedule
      </h1>
      <p className="mb-8 max-w-prose font-serif text-sm text-[var(--color-ink-muted)]">
        Meeting times for every course currently offered in this LMS.
      </p>

      <Card>
        {courses.length === 0 ? (
          <p className="font-serif text-sm text-[var(--color-ink-muted)]">
            No courses have been scheduled yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left font-serif text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-4">Term</th>
                <th className="py-2 pr-4">Professor</th>
                <th className="py-2">Meeting times</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-black/5 last:border-0">
                  <td className="py-3 pr-4">{course.title}</td>
                  <td className="py-3 pr-4">{course.term}</td>
                  <td className="py-3 pr-4">{formatCourseProfessors(course)}</td>
                  <td className="py-3 text-[var(--color-ink-muted)]">
                    {course.meetingTimes || "Not scheduled yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      <h2 className="mt-12 mb-2 font-heading text-2xl font-semibold text-[var(--color-forest)]">
        2026–27 Theravāda Studies Offerings
      </h2>
      <p className="mb-6 max-w-prose font-serif text-sm text-[var(--color-ink-muted)]">
        Certificate-program offerings hosted outside this LMS — most run
        through Zoom, IMC, or the Sati Center directly. Register and access
        materials at the links below.
      </p>

      <div className="flex flex-col gap-6">
        {THERAVADA_OFFERINGS.map((item) => (
          <Card key={item.title}>
            <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">
              {item.title}{" "}
              {item.units && (
                <span className="font-serif text-sm font-normal text-[var(--color-ink-muted)]">
                  ({item.units})
                </span>
              )}
            </h3>
            <p className="mt-1 font-serif text-sm font-medium text-[var(--color-forest)]">
              {item.meta}
            </p>
            {item.note && (
              <p className="mt-2 font-serif text-sm text-[var(--color-ink-muted)]">
                {item.note}
              </p>
            )}
            {item.href && (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
              >
                More Information →
              </a>
            )}
            {item.seminars && (
              <ol className="mt-4 flex flex-col gap-4 border-t border-black/10 pt-4">
                {item.seminars.map((seminar) => (
                  <li key={seminar.title} className="font-serif text-sm">
                    <p className="font-medium text-[var(--color-ink)]">{seminar.title}</p>
                    <p className="text-[var(--color-ink-muted)]">{seminar.when}</p>
                    <a
                      href={seminar.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-forest)] underline underline-offset-2"
                    >
                      More Information →
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        ))}

        <Card>
          <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">
            Sutta Study
          </h3>
          <p className="mt-1 font-serif text-sm font-medium text-[var(--color-forest)]">
            Two self-paced systematic courses on the Middle Length Discourses
            of the Buddha (Majjhima Nikāya) · Taught by Gil Fronsdal &amp;
            Diana Clark
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {SUTTA_STUDY_COURSES.map((course) => (
              <li key={course.href} className="font-serif text-sm text-[var(--color-ink-muted)]">
                {course.title} —{" "}
                <a
                  href={course.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-forest)] underline underline-offset-2"
                >
                  More Information →
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
