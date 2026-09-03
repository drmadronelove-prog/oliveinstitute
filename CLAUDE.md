# Olive Institute — project brief

Read this before starting work. `README.md` covers setup, routes, and the
data model; this file covers intent and the decisions already made.

## What this is

A storefront for **self-paced** courses. Admins create accounts and
courses; professors attach materials; students enroll and work through
them whenever they like.

This repository began as a fork of SatiLMS, a cohort-based LMS, and was
converted by stripping out everything specific to running a live class.

## What was deliberately removed — don't rebuild it

The following were deleted in the conversion. Treat their absence as a
product decision, not an omission, and don't reintroduce any of it without
being asked:

- **Models:** `Assignment`, `Submission`, `Feedback` (submission feedback),
  `AttendanceRecord`, `CourseProfessor` (co-teachers), `DirectEmail`
- **Enums:** `SubmissionStatus`, `SubmissionGrade`, `AttendanceStatus`,
  `CreditStatus`, `EnrollmentStatus`
- **Routes:** professor assignment and attendance pages, student
  assignment pages, `/schedule`, `/calendar`, `/registration`, and the
  admin and professor email tools (`/admin/emails`,
  `/admin/users/[id]/email`, `/professor/students/[id]/email`)
- **Everything else that referenced them:** `src/lib/actions/email.ts`,
  `FeedbackThread`, `ComposeEmailForm`, `src/lib/labels.ts`, the cohort
  import scripts under `scripts/`, and the matching Playwright specs

`Enrollment` lost its `status` and `creditStatus` columns with those enums,
so an enrollment is now simply a row that exists or doesn't — unenrolling
deletes it rather than marking it `DROPPED`.

The database was re-baselined: the old migration history is gone, replaced
by a single `init` migration matching the current schema.

## What was kept

`src/lib/auth.ts`, `src/lib/rbac.ts`, `src/lib/storage.ts`,
`src/lib/email.ts`, the `AppShell` shell and `ui/` components, and
`/api/files`. `Role` still has `PROFESSOR` and `STUDENT` alongside `ADMIN`,
and `Course` still has one owning professor.

## Known loose ends

- `Course.meetingTimes` and its admin form survive the conversion even
  though `/schedule` is gone. It is unused by any remaining page and is a
  reasonable next thing to drop.
- `public/brand/logo.png` is still the original Sati Center mark, renamed.
  Replace it with real Olive Institute artwork.
- `docs/screenshots/` was removed as stale; regenerate if screenshots are
  wanted in the README again.

## Working notes

- Prioritize RBAC correctness: every page and Server Action calls
  `requireRole`/`requireSession` first, and `/api/files` authorizes
  independently. Keep it that way.
- There is no public sign-up and no demo account. The seed provisions one
  ADMIN from the environment and fails loudly if it is unset — don't add
  fallback credentials.
- Ask before choosing between ambiguous options rather than guessing
  silently. If no one is available to answer, take the safer default,
  document it here, and flag it as open.
