# Olive Institute — project brief

Read this before starting work. `README.md` covers setup, routes, and the
data model; this file covers intent and the decisions already made.

## What this is

A storefront for **self-paced** courses. Anyone can create their own
account; admins create courses and can also create or comp accounts by
hand; instructors attach materials; learners enroll and work through them
whenever they like.

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
`/api/files`. `Role` still has two non-admin values alongside `ADMIN`, and
`Course` still has one owning instructor.

## Storefront schema (phase 3)

The schema was rebuilt around selling self-paced courses:

- `Course` is a product — `slug`, `track`, `priceCents`, `status`,
  `estimatedMinutes`, `sortOrder`, Stripe price id. The cohort-era `term`,
  `credits`, and `meetingTimes` are gone, and `professorId` became
  `instructorId`.
- Content is `Course -> Module -> Lesson`, and `CourseMaterial` became
  `LessonResource` hanging off a lesson. Modules and lessons cascade on
  delete; resources cascade with their lesson.
- `Enrollment` is the grant of access and records its `source`. `Purchase`
  records the Stripe side. `LessonProgress` is per learner, per lesson.
- **`src/lib/entitlements.ts` is the only place that decides whether
  someone may see something.** Do not re-derive access from enrollments,
  course status, or `isFreePreview` anywhere else — call `hasAccess` or
  `canViewLesson`, and change the rules there. `/api/files` and the learner
  course page already go through it.
- The migration is written to be safe on a populated database (new NOT NULL
  columns are added nullable, backfilled, then constrained). The one
  unavoidable loss is `course_materials`, which had no lesson to move to.

## Public storefront (phase 4)

`/`, `/clinicians`, `/explore`, and `/courses/[slug]` are the logged-out
surface, wrapped in `PublicShell` rather than `AppShell`.

- Only PUBLISHED courses are listed or reachable. `src/lib/catalog.ts` is
  the one listing query so the filter cannot be forgotten at a call site.
- `canViewLesson` now takes `string | null` so a logged-out visitor can be
  asked about a free preview. The sales page and `/api/files` both pass
  `session?.user.id ?? null` — neither re-reads `isFreePreview` itself.
- **Do not add a root `loading.tsx`.** Its Suspense boundary makes Next
  flush a 200 before the page resolves, turning every `notFound()` in the
  app into a soft 404. This was found and removed in this phase; scope any
  loading UI to a segment that never calls `notFound()`.
- The static storefront routes are `force-dynamic`: the catalogue is
  database-backed, so prerendering would bake the course list into the build
  and require a live database to build at all. `/courses/[slug]` is not
  marked — a dynamic param route is already on demand, and the flag is not
  what makes its 404 work.

## Self-service accounts (phase 5)

Reversed the original admin-invite model: people register themselves at
`/register` rather than an admin creating every account.

- `/register` always creates a `LEARNER` and always sends a verification
  email — there is no way to self-register as anything more privileged.
  An admin can still create an account directly from `/admin/users`, but
  that path changed too: it now emails an invite link instead of
  generating a temporary password, so a password is never something an
  admin holds or transmits. `sendPasswordResetForUserAction` is the same
  idea for getting an existing user back in.
- **Verification gates purchasing, not signing in.** An unverified account
  can sign in, browse, and watch free previews — only `canPurchase` in
  `src/lib/entitlements.ts` checks `emailVerifiedAt`. Keep that the one
  place the rule lives; don't re-check verification anywhere else.
- Password reset and email verification share `src/lib/tokens.ts`: a
  random token is emailed, only its SHA-256 hash is stored, and redeeming
  one retires every other outstanding token for that user. Reset tokens
  are one hour; verification tokens are one day.
- Rate limiting (`src/lib/rateLimit.ts`) is rows in `rate_limit_hits`
  counted in an hourly window, keyed by both IP and the target email, so
  it survives a restart. Applies to `/register` and `/forgot-password`
  (and settings' resend-verification, which shares the register budget).
- `EMAIL_CAPTURE_DIR` (dev/test only — never set in production) makes
  `src/lib/email.ts` also write every sent message to disk as JSON, which
  is how `tests/accounts.spec.ts` follows real links instead of reaching
  into the database for a token it could not unhash anyway.
- `/settings` replaced `/settings/password`: it is now three panels
  (profile, change password, purchase history) and is where an unverified
  user resends their confirmation email.
- `assessPasswordStrength` / `validatePassword` in `src/lib/password.ts`
  are the one strength definition, used by registration, reset, and
  change-password alike — don't add a second rule.

## Known loose ends

- There is no logo asset. `src/components/shell/Wordmark.tsx` renders a
  text wordmark; swap real artwork in there when it exists.
- `docs/screenshots/` was removed as stale; regenerate if screenshots are
  wanted in the README again.
- Route segments still read `professor`/`student`
  (`/professor/courses/[id]`, `/student/courses/[id]`), even though the
  roles and `Course.instructorId` were renamed. Changing the URLs is a
  separate, breaking change.
- There is no UI for creating modules or lessons — the seed is the only
  thing that writes them. Instructors can attach resources to an existing
  lesson, and admins can create, publish, and archive courses.
- Nothing writes `Purchase` or `LessonProgress` yet. The Buy button is
  therefore a stub: it sends a logged-out visitor to `/register`, and for a
  signed-in, verified visitor who does not own the course it renders
  disabled with a note. Wiring Stripe checkout is what makes it real.
  `EnrollmentSource.PURCHASE` and `BUNDLE` are unused so far — every
  enrollment the UI creates is a `COMP`. `/settings`' purchase-history panel
  already reads `Purchase`, so it will show real rows the moment checkout
  writes them.
- `Course.coverImageKey` is still unused, and there is no public route that
  serves an image by key, so pages set no `og:image`. Serving cover images
  needs a public asset route — `/api/files` is entitlement-gated by design
  and an Open Graph crawler is anonymous.
- `Enrollment` carries both `createdAt` and `grantedAt`, which are
  redundant today. `grantedAt` was specified; `createdAt` predates it.

## Rebrand (phase 2)

The Sati palette and typography were replaced wholesale:

- **Palette** (`src/app/globals.css`): deep olive `#3F4F33`, sage
  `#7E9068`, pale sage `#EDF0E8`, warm ivory `#FAF8F2`, terracotta
  `#A0553A`, muted gold `#A98B4F`, plus derived shades. The old
  forest/cream/slate-blue tokens are gone — don't reintroduce a cool
  accent, terracotta is the one warm accent.
- **Type**: Cormorant Garamond (`font-heading`) and DM Sans (`font-body`),
  both via `next/font`. The `font-serif` utility was removed rather than
  left pointing at a sans face.
- **Roles**: `PROFESSOR` → `INSTRUCTOR`, `STUDENT` → `LEARNER`, migrated
  with `ALTER TYPE ... RENAME VALUE` so existing rows keep their role.
- **Base path**: the app is mounted at `/institute`; see README for the
  three places that need `withBasePath()`.

## Working notes

- Prioritize RBAC correctness: every page and Server Action calls
  `requireRole`/`requireSession` first, and `/api/files` authorizes
  independently. Keep it that way.
- There is no demo account and no fallback credentials. The seed
  provisions exactly one ADMIN from the environment and fails loudly if it
  is unset. Everyone else signs up at `/register`, or an admin invites them
  from `/admin/users` — either way the account holder is the only one who
  ever sets their password.
- Ask before choosing between ambiguous options rather than guessing
  silently. If no one is available to answer, take the safer default,
  document it here, and flag it as open.
