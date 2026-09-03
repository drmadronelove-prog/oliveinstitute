import Link from "next/link";
import { requireSession } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type CalendarEntry = {
  date: Date;
  type: "Assignment due" | "Attendance" | "Class session";
  label: string;
  courseTitle: string;
  href?: string;
};

/**
 * Known session dates for the Theravada Studies Seminar (from /schedule),
 * the only offering in the 2026-27 catalog with specific dates published —
 * the others (Anukampa, Deepening Meditation, Eightfold Path, Sutta Study)
 * only have a date range, not individual session dates. Shown to every
 * role, same as the schedule page's informational offerings section —
 * these aren't tied to a specific course's roster the way Assignment/
 * AttendanceRecord rows are.
 */
const SEMINAR_SESSIONS: Array<{ date: string; label: string; href: string }> = [
  {
    date: "2026-08-20T12:00:00Z",
    label:
      "Sutta Study: The Naturalistic Teachings of the Simile of the Cloth — Gil Fronsdal (3:30–5:30 PM Pacific incl. Certificate Discussion)",
    href: "https://sati.org/event/the-naturalistic-teachings-of-the-buddha/",
  },
  {
    date: "2026-10-02T12:00:00Z",
    label: "Theravada Buddhism — Aleix Ruiz-Falqués, session 1 of 4 (8:00–9:30 AM Pacific)",
    href: "https://sati.org/series/theravada-buddhism-with-dr-aleix-ruiz-falques/",
  },
  {
    date: "2026-10-09T12:00:00Z",
    label: "Theravada Buddhism — Aleix Ruiz-Falqués, session 2 of 4 (8:00–9:30 AM Pacific)",
    href: "https://sati.org/series/theravada-buddhism-with-dr-aleix-ruiz-falques/",
  },
  {
    date: "2026-10-15T12:00:00Z",
    label:
      "The Verses of the Nuns (Therigatha) — Gil Fronsdal, session 1 of 5 (3:30–5:30 PM Pacific incl. Certificate Discussion)",
    href: "https://sati.org/series/therigatha-the-poetry-of-the-enlightened-nuns/",
  },
  {
    date: "2026-10-16T12:00:00Z",
    label: "Theravada Buddhism — Aleix Ruiz-Falqués, session 3 of 4 (8:00–9:30 AM Pacific)",
    href: "https://sati.org/series/theravada-buddhism-with-dr-aleix-ruiz-falques/",
  },
  {
    date: "2026-10-22T12:00:00Z",
    label:
      "The Verses of the Nuns (Therigatha) — Gil Fronsdal, session 2 of 5 (3:30–5:30 PM Pacific incl. Certificate Discussion)",
    href: "https://sati.org/series/therigatha-the-poetry-of-the-enlightened-nuns/",
  },
  {
    date: "2026-10-23T12:00:00Z",
    label: "Theravada Buddhism — Aleix Ruiz-Falqués, session 4 of 4 (8:00–9:30 AM Pacific)",
    href: "https://sati.org/series/theravada-buddhism-with-dr-aleix-ruiz-falques/",
  },
  {
    date: "2026-10-29T12:00:00Z",
    label:
      "Sutta Study: The Buddha's Critique of the Brahmanical \"Self\" — Gil Fronsdal (3:30–5:30 PM Pacific incl. Certificate Discussion)",
    href: "https://sati.org/event/buddhas-experiential-alternative-to-the-brahmanical-self/",
  },
  {
    date: "2026-10-29T12:00:00Z",
    label:
      "The Verses of the Nuns (Therigatha) — Gil Fronsdal, session 3 of 5 (3:30–5:30 PM Pacific incl. Certificate Discussion)",
    href: "https://sati.org/series/therigatha-the-poetry-of-the-enlightened-nuns/",
  },
  {
    date: "2026-11-05T13:00:00Z",
    label:
      "The Verses of the Nuns (Therigatha) — Gil Fronsdal, session 4 of 5 (3:30–5:30 PM Pacific incl. Certificate Discussion)",
    href: "https://sati.org/series/therigatha-the-poetry-of-the-enlightened-nuns/",
  },
  {
    date: "2026-11-12T13:00:00Z",
    label:
      "The Verses of the Nuns (Therigatha) — Gil Fronsdal, session 5 of 5 (3:30–5:30 PM Pacific incl. Certificate Discussion)",
    href: "https://sati.org/series/therigatha-the-poetry-of-the-enlightened-nuns/",
  },
];

function loadSeminarSessions(): CalendarEntry[] {
  return SEMINAR_SESSIONS.map((s) => ({
    date: new Date(s.date),
    type: "Class session" as const,
    label: s.label,
    courseTitle: "Theravada Studies Seminar",
    href: s.href,
  }));
}

async function loadEntries(userId: string, role: string): Promise<CalendarEntry[]> {
  if (role === "STUDENT") {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: "ACTIVE" },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const [assignments, attendance] = await Promise.all([
      prisma.assignment.findMany({
        where: { courseId: { in: courseIds } },
        include: { course: { select: { title: true } } },
      }),
      prisma.attendanceRecord.findMany({
        where: { studentId: userId, courseId: { in: courseIds } },
        include: { course: { select: { title: true } } },
      }),
    ]);

    return [
      ...assignments.map((a) => ({
        date: a.dueAt,
        type: "Assignment due" as const,
        label: a.title,
        courseTitle: a.course.title,
      })),
      ...attendance.map((r) => ({
        date: r.sessionDate,
        type: "Attendance" as const,
        label: r.status,
        courseTitle: r.course.title,
      })),
    ];
  }

  const courseFilter =
    role === "PROFESSOR" ? { professorId: userId } : {};
  const courses = await prisma.course.findMany({
    where: courseFilter,
    select: { id: true, title: true },
  });
  const courseIds = courses.map((c) => c.id);
  const titleById = new Map(courses.map((c) => [c.id, c.title]));

  const [assignments, sessions] = await Promise.all([
    prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      include: { course: { select: { title: true } } },
    }),
    prisma.attendanceRecord.findMany({
      where: { courseId: { in: courseIds } },
      distinct: ["courseId", "sessionDate"],
      select: { courseId: true, sessionDate: true },
    }),
  ]);

  return [
    ...assignments.map((a) => ({
      date: a.dueAt,
      type: "Assignment due" as const,
      label: a.title,
      courseTitle: a.course.title,
    })),
    ...sessions.map((s) => ({
      date: s.sessionDate,
      type: "Attendance" as const,
      label: "Attendance session",
      courseTitle: titleById.get(s.courseId) ?? "",
    })),
  ];
}

const TYPE_DOT_COLOR: Record<CalendarEntry["type"], string> = {
  "Assignment due": "var(--color-gold)",
  Attendance: "var(--color-sage)",
  "Class session": "var(--color-forest)",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(date: Date) {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

type MonthCell = { date: Date; inMonth: boolean };

function buildMonthGrid(year: number, monthIndex: number): MonthCell[] {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(Date.UTC(year, monthIndex, 1 - startWeekday + i));
    return { date, inMonth: date.getUTCMonth() === monthIndex };
  });
}

function monthHref(year: number, monthIndex: number) {
  const normalized = new Date(Date.UTC(year, monthIndex, 1));
  const m = String(normalized.getUTCMonth() + 1).padStart(2, "0");
  return `/calendar?month=${normalized.getUTCFullYear()}-${m}`;
}

function MonthGrid({
  year,
  monthIndex,
  entriesByDay,
  today,
}: {
  year: number;
  monthIndex: number;
  entriesByDay: Map<string, CalendarEntry[]>;
  today: Date;
}) {
  const cells = buildMonthGrid(year, monthIndex);
  const monthLabel = new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const todayKey = dayKey(today);

  return (
    <Card className="overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={monthHref(year, monthIndex - 1)}
          className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
        >
          ← Prev
        </Link>
        <h2 className="font-heading text-xl font-semibold text-[var(--color-ink)]">{monthLabel}</h2>
        <Link
          href={monthHref(year, monthIndex + 1)}
          className="font-serif text-sm text-[var(--color-forest)] underline underline-offset-2"
        >
          Next →
        </Link>
      </div>

      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b border-black/10 pb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center font-serif text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const key = dayKey(cell.date);
            const dayEntries = entriesByDay.get(key) ?? [];
            const visible = dayEntries.slice(0, 3);
            const overflow = dayEntries.length - visible.length;
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                className={`min-h-[92px] border-b border-r border-black/5 p-1.5 ${
                  cell.inMonth ? "" : "opacity-40"
                }`}
              >
                <p
                  className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full font-serif text-xs ${
                    isToday
                      ? "bg-[var(--color-forest)] text-white"
                      : "text-[var(--color-ink-muted)]"
                  }`}
                >
                  {cell.date.getUTCDate()}
                </p>
                <div className="flex flex-col gap-0.5">
                  {visible.map((entry, i) => (
                    <span
                      key={i}
                      title={`${entry.label} — ${entry.courseTitle}`}
                      className="flex items-center gap-1 truncate font-serif text-[11px] text-[var(--color-ink)]"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: TYPE_DOT_COLOR[entry.type] }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{entry.label}</span>
                    </span>
                  ))}
                  {overflow > 0 && (
                    <span className="font-serif text-[11px] text-[var(--color-ink-muted)]">
                      +{overflow} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {(Object.keys(TYPE_DOT_COLOR) as Array<CalendarEntry["type"]>).map((type) => (
          <span key={type} className="flex items-center gap-1.5 font-serif text-xs text-[var(--color-ink-muted)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: TYPE_DOT_COLOR[type] }}
              aria-hidden="true"
            />
            {type}
          </span>
        ))}
      </div>
    </Card>
  );
}

function EntryRow({ entry }: { entry: CalendarEntry }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg bg-[var(--color-cream)] px-4 py-3">
      <div>
        <p className="font-serif text-sm font-medium text-[var(--color-ink)]">
          {entry.href ? (
            <a
              href={entry.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {entry.label}
            </a>
          ) : (
            entry.label
          )}
        </p>
        <p className="font-serif text-xs text-[var(--color-ink-muted)]">
          {entry.courseTitle} &middot;{" "}
          {entry.date.toLocaleDateString("en-US", {
            dateStyle: "medium",
          })}
        </p>
      </div>
      <Badge>{entry.type}</Badge>
    </li>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requireSession();
  const { month } = await searchParams;
  const entries = [
    ...(await loadEntries(session.user.id, session.user.role)),
    ...loadSeminarSessions(),
  ];

  const now = new Date();
  const upcoming = entries
    .filter((e) => e.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const past = entries
    .filter((e) => e.date < now)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const monthMatch = month?.match(/^(\d{4})-(\d{2})$/);
  const year = monthMatch ? Number(monthMatch[1]) : now.getUTCFullYear();
  const monthIndex = monthMatch ? Number(monthMatch[2]) - 1 : now.getUTCMonth();

  const entriesByDay = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = dayKey(entry.date);
    const bucket = entriesByDay.get(key);
    if (bucket) bucket.push(entry);
    else entriesByDay.set(key, [entry]);
  }

  return (
    <AppShell activeHref="/calendar">
      <h1 className="mb-2 font-heading text-3xl font-semibold text-[var(--color-forest)]">
        Calendar
      </h1>
      <p className="mb-8 max-w-prose font-serif text-sm text-[var(--color-ink-muted)]">
        Assignment due dates and attendance sessions from your courses,
        gathered automatically, alongside published Theravada Studies
        Seminar session dates.
      </p>

      <div className="mb-8">
        <MonthGrid year={year} monthIndex={monthIndex} entriesByDay={entriesByDay} today={now} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              Nothing upcoming.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((entry, index) => (
                <EntryRow key={index} entry={entry} />
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--color-ink)]">
            Past
          </h2>
          {past.length === 0 ? (
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              Nothing yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {past.map((entry, index) => (
                <EntryRow key={index} entry={entry} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
