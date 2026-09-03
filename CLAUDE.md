# Sati Center LMS — build plan

**Status: all 10 planned stages are complete** (see the stage plan below,
each marked ✅ with what was built and how it was verified). What's left
is the "Explicitly out of scope" list at the end of this file, plus
whatever the next real request turns out to be — read the whole file
before picking up new work so you don't re-decide things already decided
(see "Decisions made so far" in README.md).

This file is the durable project brief for building the Sati Center LMS. Read
it fully before starting work in a new session. Work through the stages
below **one at a time**: implement a stage, verify its acceptance criteria,
commit, and stop to report — don't jump ahead to the next stage in the same
pass unless explicitly asked to.

See `README.md` for local setup and the current build status.

## Project summary

A self-hosted LMS for the Sati Center for Buddhist Studies, modeled on
Canvas's core workflows but scoped to what's actually needed:

- Multiple login roles: Admin, Professor/Teacher, Student.
- Students upload assignments; professors view submissions and give
  feedback in-app.
- Professors log attendance and track course credit per student.
- Professors/admins send site-wide announcements and one-off emails to
  individual students.
- Professors upload course materials: PDFs, web links, and videos.
- Visual design matches the Sati Center reference dashboard (see "Visual
  design spec" below).

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Prisma ORM — **pinned to Prisma 6**, not 7
  (Prisma 7 requires driver-adapter wiring for every `PrismaClient`; not
  worth the indirection here — see README for detail).
- **Auth:** NextAuth.js v5 (Auth.js), Credentials provider, JWT sessions,
  `role` field on the session. Passwords hashed with bcrypt.
- **File storage:** local disk / S3-compatible bucket, behind a storage
  interface (Stage 4) so swapping to S3 is a config change.
- **Email:** Resend or SMTP behind an `EmailService` interface (Stage 8).
- **Video:** uploaded file or embed via URL (YouTube/Vimeo/S3 signed URL) —
  no transcoding pipeline.
- **Testing:** Vitest/Jest + Playwright for critical flows (login,
  submission upload, feedback, announcement send) — Stage 10.

## Visual design spec

Match this before building feature pages — the design system (Stage 1)
comes before feature work.

- Top nav bar: dark forest green (`#2d4a3e`-ish) full-width bar. Left:
  square logo icon with cream/gold background and a seated-figure icon,
  next to serif wordmark "Sati Center" with a smaller subtitle line "for
  Buddhist Studies" underneath. Right: nav links in cream/white serif text
  (Canvas, Course Registration, Calendar, Class Schedule, Faculty and
  Staff); active link has an underline.
- Page background: warm off-white/cream (`#efece2`-ish).
- Left sidebar: "QUICKLINKS" label in small-caps letter-spaced dark green.
  Below it, a vertical stack of pill-shaped buttons in a slightly warmer
  cream than the page background, each with a soft embossed/neumorphic
  shadow (raised, tactile look — soft outer shadow + subtle inner
  highlight, monochromatic palette). Buttons: Canvas, Course Registration,
  Calendar, Class Schedule, Asynchronous Classes, Faculty and Staff,
  Theravada Studies, Spiritual Care, Sati Library, Insight Meditation
  Center, Audiodharma, Insight Retreat Center.
- Hero card: large rounded-corner card in sage/muted green, serif white
  heading (e.g. "Sati Certificate Program" — becomes the page title per
  section), thin gold/mustard divider rule under the heading, supporting
  white subtext below. Right side: square image with rounded corners and a
  thin gold border.
- Announcements section: italic serif section heading ("Announcements").
  Below it, white rounded-corner cards with a colored left accent bar, a
  small pill/badge for category (e.g. "Registration") next to a small-caps
  date, a bold headline, and body text with inline underlined links.
- Typography: serif throughout (headings and body), generous whitespace,
  warm/muted palette (forest green, sage, cream, gold accents) — no bright
  colors.
- Reuse this shell (top nav + sidebar + card system) across every role's
  dashboard; only the content in the main panel changes per role.

## Data model (starting point — expand as needed)

- `User` (id, name, email, passwordHash, role: ADMIN | PROFESSOR | STUDENT,
  createdAt)
- `Course` (id, title, description, term, credits, professorId)
- `Enrollment` (id, userId, courseId, status, creditStatus)
- `Assignment` (id, courseId, title, description, dueAt, maxPoints)
- `Submission` (id, assignmentId, studentId, fileUrl or text, submittedAt,
  status, grade, feedback[])
- `Feedback` (id, submissionId, authorId, body, createdAt) — threaded
  comments
- `AttendanceRecord` (id, courseId, studentId, sessionDate, status:
  PRESENT|ABSENT|EXCUSED)
- `CourseMaterial` (id, courseId, type: PDF|LINK|VIDEO, title, url/fileRef,
  uploadedAt)
- `Announcement` (id, authorId, title, body, audience: ALL|COURSE,
  courseId?, publishedAt)
- `DirectEmail` (id, senderId, recipientId, subject, body, sentAt) — log of
  individual emails sent

All of the above is implemented in `prisma/schema.prisma` as of Stage 0.

## Stage plan

Work through these in order. At the end of each stage: run the app, verify
the acceptance criteria, commit, then stop and report before starting the
next stage.

- **Stage 0 — Project scaffolding.** ✅ Done. Next.js+TS+Tailwind+Prisma+
  Postgres, NextAuth credentials provider with role on session, seed script
  (admin/professor/student). Acceptance: `npm run dev` boots, can log in as
  seeded admin.
- **Stage 1 — Design system.** ✅ Done. Shared shell (`AppShell` = `TopNav` +
  `Sidebar` + main panel) in `src/components/shell/`, reusable `ui/`
  components (`Card`, `Badge`, `QuickLinkButton`), dashboard-specific
  `HeroCard`/`AnnouncementCard` in `src/components/dashboard/`. Color
  tokens and neumorphic shadow utilities in `src/app/globals.css`, Lora
  serif font wired in `layout.tsx`. `/style-guide` route shows every
  component in isolation. `/login` and `/dashboard` re-themed on top of it.
  Acceptance met: style guide and dashboard visually match the reference
  (verified via Playwright screenshots) — dark forest nav, cream page bg,
  neumorphic quicklink pills, sage hero card w/ gold divider, white
  announcement cards w/ colored accent bar.
- **Stage 2 — Auth & roles.** ✅ Done. `src/lib/rbac.ts` provides
  `requireSession`/`requireRole` helpers used at the top of every protected
  Server Component and Server Action (defense in depth — `proxy.ts` only
  does a thin cookie-presence check). `/admin/users` (Admin-only) lists all
  users and creates new accounts with a generated temporary password —
  there's no public sign-up, admins create every account. `/forbidden`
  (403-styled page) is where non-admins land if they try `/admin/*`
  directly. `/settings/password` lets any signed-in user change their own
  password (current + new); admins can also force-reset another user's
  password from `/admin/users` (generates a new temp password to hand off
  out of band). `/dashboard` now shows a role-specific panel (`RolePanel`)
  alongside the shared hero/announcements. Acceptance verified end-to-end
  via Playwright: student blocked from `/admin/users` → `/forbidden`;
  admin creates a professor account; new professor logs in with the temp
  password, lands on `/dashboard`, is blocked from `/admin/users`, changes
  their own password, and re-logs-in with the new one. Data-level RBAC
  ("students can't see other students' submissions") has no data to scope
  yet — that arrives with Submission in Stage 5/6, reusing these same
  helpers.
- **Stage 3 — Core dashboards & course structure.** ✅ Done.
  `/admin/courses` (Admin-only): create courses (title, description, term,
  credits, assigned professor), list all courses. `/admin/courses/[id]`:
  reassign the professor, enroll/unenroll students (unenroll sets
  `Enrollment.status = DROPPED` rather than deleting — keeps history).
  `/dashboard` queries role-scoped data server-side and passes it to
  `RolePanel`: Professor sees `Course.findMany({ professorId })`, Student
  sees `Enrollment.findMany({ userId, status: ACTIVE })` joined to course
  + credit status. Acceptance verified via Playwright: admin creates a
  course and enrolls the seeded student; professor's dashboard shows
  exactly that one course with an enrollment count; student's dashboard
  shows exactly that one course with credit status "In progress"; student
  is still blocked from `/admin/courses` (`/forbidden`).
- **Stage 4 — Course materials.** ✅ Done. `src/lib/storage.ts` defines a
  `StorageService` interface (`saveFile`); `LocalDiskStorage` is the only
  implementation today, writing under `UPLOADS_DIR` — swap in an
  `S3StorageService` (returning a signed URL instead of a local path)
  without touching call sites, since `CourseMaterial.url` is already
  storage-agnostic. `/professor/courses/[id]` (owner-only — 404s otherwise,
  not 403, to avoid confirming a course ID exists to non-owners): one form
  adds PDF/LINK/VIDEO materials (`addMaterialAction`), with delete.
  `/student/courses/[id]` (enrolled-only) is the read-only view — YouTube
  video URLs get an inline iframe embed, everything else (PDFs, other
  video links, plain links) is a link out. Files are served through
  `/api/files/[...key]`, a route handler that independently re-checks
  auth + course ownership/enrollment per request (not just relying on
  `proxy.ts` or an unguessable URL) — verified: 401 when logged out, 200
  for the enrolled student, and the underlying key stays outside `public/`
  so it's never served unauthenticated by the static file server.
  Acceptance verified via Playwright: professor uploads a PDF, adds a
  link, adds a video URL; student's course page shows all three.
- **Stage 5 — Assignments & submissions.** ✅ Done. Professors create
  assignments from `/professor/courses/[id]` (title, instructions, due
  date, points); each links to `/professor/courses/[id]/assignments/[id]`
  listing every submission (not deduped — each `Submission` row is
  independently gradable in Stage 6, matching the schema). Students
  submit file-or-text from `/student/courses/[id]/assignments/[id]`;
  resubmitting creates a new `Submission` row rather than overwriting, so
  history is preserved and shown newest-first. Late is computed at submit
  time (`now > assignment.dueAt` → `status: LATE`), not recomputed later.
  **Important fix included in this stage:** `/api/files/[...key]` used to
  authorize purely by course membership, which would have let any
  classmate fetch another student's submission file once submissions
  existed. It now looks up whether the requested URL belongs to a
  `CourseMaterial` (course-wide access) or a `Submission` (author + course
  professor + admin only) and authorizes accordingly. Verified via
  Playwright: a second enrolled student attempting to fetch another
  student's submission file gets 403. Acceptance verified: professor
  creates a past-due assignment, student submits a PDF (correctly flagged
  LATE), professor's assignment page lists it with student name and
  timestamp.
- **Stage 6 — Grading & feedback.** ✅ Done. `reviewSubmissionAction`
  (professor assignment page) takes an optional grade and/or feedback body
  in one form per submission; saving either marks the submission
  `REVIEWED` with `reviewedAt` set (wrapped in a `$transaction` so the
  grade update and the `Feedback` row are written together). `Feedback`
  rows are threaded by `submissionId`, ordered oldest-first, and rendered
  by a shared `FeedbackThread` component on both the professor's
  submissions list and the student's own submission view — one-directional
  (professor → student) for now; the schema already supports students
  replying if that's wanted later. Acceptance verified via Playwright:
  professor grades a submission and leaves feedback in one save; student's
  assignment page immediately shows the grade, the feedback text, and
  `REVIEWED` status.
- **Stage 7 — Attendance & course credit.** ✅ Done.
  `/professor/courses/[id]/attendance`: a session-date picker (GET,
  `?date=`) re-fetches the roster server-side with that date's existing
  records pre-selected; saving upserts one `AttendanceRecord` per student
  for that date (unique on `courseId_studentId_sessionDate`). The same
  page has a "Course credit" panel — professor manually sets each
  enrollment's `creditStatus`; admin already sees it in
  `/admin/courses/[id]` (Stage 3), and the student's course page now shows
  their credit status as a badge plus their own attendance history.
  **Bug caught and fixed during verification:** the credit-status
  `<select>` and attendance radios used uncontrolled `defaultValue`/
  `defaultChecked`, which React does not re-apply to an already-mounted
  element when the server-refreshed prop changes after a save — so the
  professor's screen kept showing the *old* value right after a
  successful save, even though the DB was correct (confirmed via a second
  Playwright check that the visible value now matches immediately after
  save, no reload needed). Fixed with a `key` on the element tied to the
  current value, forcing a remount when the underlying value changes.
  Acceptance verified: professor marks attendance and sets credit status
  for a session; student's own attendance record and credit-status badge
  update accordingly on their course page.
- **Stage 8 — Communications.** ✅ Done, **but the announcements half was
  later removed entirely by explicit request** (2026-08-27) — the
  `Announcement`/`AnnouncementAudience` schema, `/admin/announcements`,
  `/professor/announcements`, `src/lib/actions/announcements.ts`,
  `AnnouncementFeed`/`AnnouncementCard`, the dashboard "Post announcements"
  tile and feed, and each course page's announcements section are all
  gone (migration `20260827153730_remove_announcements` drops the table).
  Don't rebuild it without being asked — the rest of this bullet is kept
  as historical record of what Stage 8 originally built. Direct
  email (below) is untouched and still the only way admins/professors
  message students individually. `src/lib/email.ts` defines
  `EmailService` (`send({to, subject, body})`); `ConsoleEmailService` logs
  to stdout in dev, `ResendEmailService` (a thin `fetch` call to Resend's
  REST API — no SDK dependency added) is used automatically once
  `RESEND_API_KEY` is set. `src/lib/actions/announcements.ts` and
  `src/lib/actions/email.ts` are shared Server Actions (not tied to one
  route) used by both `/admin/announcements` and `/professor/announcements`
  (ADMIN can post to any course or site-wide; PROFESSOR can post site-wide
  or to a course they teach — matching the brief's "Professors/admins send
  site-wide announcements" wording). `/dashboard` shows each role's
  relevant feed (ALL + their own courses); course detail pages show that
  course's own announcements. Announcement bodies are rendered as plain
  text (`whitespace-pre-wrap`), not parsed as HTML/markdown — deliberate,
  to avoid the XSS surface of rendering user-authored HTML; revisit only
  with a real sanitizer if rich formatting is wanted later. Individual
  email: `/admin/users/[id]/email` (any user) and
  `/professor/students/[id]/email` (only students enrolled in one of that
  professor's courses — enforced both in the page, via `notFound()`, and
  independently in the Server Action). Every send is logged to
  `DirectEmail`, visible at `/admin/emails`. Acceptance verified via
  Playwright: admin posts a site-wide announcement and emails a student;
  professor posts a course-scoped announcement and emails their own
  student; student's dashboard shows both announcements, the course page
  shows the course-scoped one, and both emails appear as `[dev email]`
  console log lines (no `RESEND_API_KEY` set) plus rows in
  `/admin/emails`.
- **Stage 9 — Calendar & class schedule.** ✅ Done. The data model had no
  field for recurring meeting times, so this stage added
  `Course.meetingTimes` (free-text, e.g. "Tuesdays & Thursdays, 6:00–7:30
  PM"), settable at course creation and editable from
  `/admin/courses/[id]`. `/schedule` lists every course with its term,
  professor, and meeting times — open to any authenticated role (it's a
  catalog page, not scoped like the course dashboards). `/calendar`
  aggregates `Assignment.dueAt` and distinct `AttendanceRecord.sessionDate`
  entries into Upcoming/Past lists, scoped per role (Student: their
  enrolled courses + their own attendance; Professor: courses they teach;
  Admin: everything). Both routes just fill in the `/calendar` and
  `/schedule` links the top nav already had since Stage 1. Acceptance
  verified via Playwright: the "Reflection Essay" assignment created in
  Stage 5 appears automatically on both the admin's and the student's
  calendar with no manual step, alongside the attendance session from
  Stage 7.
- **Stage 10 — Hardening & polish.** ✅ Done — all 10 stages complete.
  - **RBAC audit:** grepped every `"use server"` file (17 Server Actions)
    and every `page.tsx` under `src/app`; each independently calls
    `requireRole`/`requireSession` as its first statement. No gaps found.
  - **Upload hardening:** added `hasDangerousExtension` (`src/lib/storage.ts`)
    — submission uploads were size-capped (25 MB) but accepted any file
    type; now also blocks executables/scripts/HTML/SVG by extension.
    Course-material PDFs already had both a mime check and a size cap
    from Stage 4.
  - **Real automated test suite** (`tests/*.spec.ts`, `@playwright/test`;
    `src/lib/__tests__/*.test.ts`, Vitest) replaces the ad hoc scratchpad
    scripts used to verify every prior stage. Covers the 5 flows the
    stage names: login/RBAC, submission → grading → feedback, announcement
    send, attendance logging. `tests/helpers.ts` provisions a fresh
    course+enrollment per test run (unique title via `Date.now()`) through
    the real admin/professor UI rather than seeding the DB directly, so
    the tests exercise Stage 2/3 RBAC and course creation as a side
    effect. Playwright's bundled browser expects a revision this sandbox
    doesn't have cached; `playwright.config.ts` reads
    `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if set rather than hardcoding a
    sandbox-specific path, so the committed config stays portable.
  - **Production-blocking bug found by this stage, not any prior one:**
    every prior stage was verified against `next dev` only. Running
    `npm run build && npm run start` for the first time (to check the
    Turbopack NFT warning and do a mobile-viewport pass against a real
    build) surfaced `UntrustedHost` on every request — Auth.js v5 needs
    explicit host trust for self-hosted deployments; only Vercel gets it
    automatically. Fixed with `trustHost: true` in `src/lib/auth.ts`,
    documented there and in README's new "Deploying" section. This is a
    good example of why Stage 10 exists as a distinct pass: feature-by-
    feature dev-mode verification never would have caught it.
  - **Closed two real dead ends:** `/registration` and `/faculty` have
    been linked from the top nav since Stage 1's design system but were
    never built (404 on click, for every role, from every page). Built
    both — `/faculty` is a real Admin/Professor directory, `/registration`
    gives role-aware guidance pointing at where enrollment actually
    happens (`/admin/courses`).
  - **Empty/loading/error states:** added root `not-found.tsx`, `error.tsx`,
    `loading.tsx` styled to match the design system rather than Next's
    defaults; wrapped remaining un-scrollable `<table>`s in
    `overflow-x-auto`. Spot-checked at a 390px mobile viewport against the
    production build — no overflow, sidebar/nav remain usable.
  - Acceptance verified: `npm run test` (4 unit + 7 E2E) passes clean;
    manually walked all three roles through their full route surface
    (dashboard → courses → materials/assignments/attendance/announcements
    → settings → sign out) with no unbuilt links remaining.

### Explicitly out of scope (for now)

Real-time chat/discussion boards, plagiarism detection, LTI integrations,
gradebook analytics/exports, mobile apps. Flag these as possible future
stages rather than building them now.

## Working notes

- Don't build this in one pass — one stage per session, with a commit and a
  short status report at the end of each.
- Ask before choosing between ambiguous options rather than guessing
  silently. If a synchronous question can't be answered (e.g. no
  interactive user available), make the safer default choice, document it
  clearly (see README "Decisions made so far"), and flag it as open for
  reconsideration.
- Prioritize getting RBAC and the data model right early — retrofitting
  permissions later is expensive.
