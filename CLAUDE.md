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

## Payments (phase 6)

One-time, per-course purchases via Stripe Checkout. `POST /api/checkout`
and `POST /api/webhooks/stripe` are the only two routes involved; the Buy
button on the sales page is a thin client wrapper around the first.

- **CRITICAL, and the reason the webhook route's top comment says so in
  capital letters: access is granted only in the webhook handler.** Nothing
  else — not `/checkout/success`, not the client-side redirect Stripe sends
  the browser through — creates or upserts an `Enrollment`. A browser
  reaching `/checkout/success` proves Stripe redirected it there, not that
  a signed webhook event verified the payment. Keep this true even under
  pressure to "just also grant access on the success page as a fallback" —
  that would let anyone who guesses the URL shape grant themselves a course
  for free.
- `/api/checkout` makes no eligibility decision of its own — it calls
  `canPurchase` (same as the sales page's CTA) and maps the refusal reason
  to an HTTP status. It creates the Stripe Checkout Session from
  `Course.priceCents`/`title` via inline `price_data`, not
  `Course.stripePriceId` (still unused — this route doesn't need a
  pre-created Stripe Price to work), and writes a `PENDING` `Purchase` row
  keyed on the session id before returning the redirect URL.
- The webhook is idempotent by construction: `checkout.session.completed`
  looks up the `Purchase` by `stripeCheckoutSessionId`, and an `Enrollment`
  upsert on the `(userId, courseId)` unique constraint means a replayed
  delivery — Stripe redelivers at least once, including after a delivery
  that already succeeded — creates at most one `Enrollment`, not a second
  one or a thrown error. `charge.refunded` is the mirror: marks the
  `Purchase` `REFUNDED` and `deleteMany`s the enrollment it granted (never
  `delete`, which would throw on a replay once the row is already gone).
  Both handlers short-circuit on an already-settled status before doing any
  writes, which is also what stops the receipt email from going out twice.
- `src/lib/stripe.ts` exports `stripeConfigured` (true only when
  `STRIPE_SECRET_KEY` is set) alongside the client. Every route that can
  reach Stripe's API checks it first, so `next build` — which imports these
  routes — never needs a live key, and an unconfigured deployment fails
  with one clear message instead of a cryptic error surfacing later.
- **On the integration test and the Stripe CLI:** the task that added this
  phase asked for coverage "using the Stripe CLI fixtures." The CLI needs
  `stripe login` (an OAuth flow through a browser against a real Stripe
  account) and network access to stripe.com; neither is available in the
  sandbox this was built in — outbound requests to `api.stripe.com` and to
  `github.com` (to fetch the CLI binary) are both blocked by the
  environment's egress policy. `src/lib/__tests__/checkout-webhook.integration.test.ts`
  uses Stripe's own officially documented alternative instead: hand-authored
  fixtures shaped like the events `stripe trigger` would deliver, signed
  locally with `stripe.webhooks.generateTestHeaderString` (pure HMAC-SHA256,
  no network call), POSTed to the real exported route handler. This is a
  hard environment constraint, not a design choice — reach for the real
  Stripe CLI instead if a network path to Stripe is available.
  `tests/checkout.spec.ts` does the same signing trick at the Playwright
  level, over a real HTTP request to the running dev server, to cover the
  full "webhook lands, success page shows a receipt, the course actually
  unlocks" loop end to end.

## Learner experience (phase 7)

`/my-courses`, `/learn/[courseSlug]`, and `/learn/[courseSlug]/[lessonSlug]`.
`src/lib/progress.ts` is the single place progress is computed — percent
complete, "continue where you left off", the position-save throttle — the
same role `entitlements.ts` plays for access. Don't re-derive any of that
elsewhere.

- The course-root route (`hasAccess`) and the lesson route
  (`canViewLesson`, open to an anonymous free-preview visitor) have
  different gating rules, so neither is enforced in the shared
  `layout.tsx` — each page checks for itself. The layout only blocks a
  DRAFT/ARCHIVED course's structure from leaking to someone who couldn't
  otherwise see it.
- Completion is only ever set by the learner's own "Mark complete" click
  (`markLessonComplete`) — never inferred from playback. Completing a
  course's last lesson stamps `Enrollment.completedAt`. No autoplay,
  auto-advance, streaks, or timers anywhere in this feature, by design.
- The position-save throttle (ten seconds) is enforced in
  `saveLessonPosition` itself, not just by the client — it checks the
  existing row's `updatedAt` age and silently drops an early write.
- `VideoPlayer` (`src/components/video/VideoPlayer.tsx`) is the one video
  player, shared by the lesson page and `LessonPreview`. It plays through
  Cloudflare Stream — see "Video (phase 8)".

## Video (phase 8)

Lesson video moved off the placeholder "embed base + videoUid" scheme onto
[Cloudflare Stream](https://developers.cloudflare.com/stream/), a real,
signed-URL video host. `src/lib/video.ts` is the one place that talks to
Stream's API — same role `stripe.ts` plays for payments, including the
`streamConfigured` guard so `next build` never needs live credentials.

- **Every video requires a signed token to play.** Uploads are created
  with `requireSignedURLs: true`. `GET /api/stream/token/[videoUid]` is
  the only way to get one: it resolves the lesson by `videoUid`, calls
  `canViewLesson` — the same rule everything else in this app defers to —
  and mints a token if allowed. `VideoPlayer` fetches its own token
  client-side rather than being handed one, since it expires and the
  component doesn't control how long the page stays open.
- **Uploading never touches this server.** `/admin/courses/[id]`'s
  `VideoUploadPanel` gets a one-time `direct_upload` URL from a Server
  Action (which stores the returned uid on `Lesson.videoUid` immediately,
  before any bytes have moved), then the browser `POST`s the file straight
  to Cloudflare.
- **Duration and captions are written back automatically, not typed in by
  hand.** Once the upload finishes, the panel bounded-auto-polls (a
  capped, chained `setTimeout` — never a bare `setInterval` left running)
  a Server Action that checks Stream's processing status; once ready, it
  writes the real `durationSeconds` onto the lesson and requests automatic
  captions. A second bounded poll waits for the caption track, then stores
  its WebVTT as plain text (`vttToPlainText`, pure and unit-tested) onto
  `Lesson.transcript` — the same field the lesson page already renders.
  Cloudflare's Stream Player shows its own CC toggle once a caption track
  exists; nothing else needs wiring for that.
- **Network constraint, same shape as Payments:** this sandbox's egress
  blocks `api.cloudflare.com`, so `video.ts` is covered by unit tests
  against a mocked `fetch` (proving request/response shape, not that a
  real account accepts them) rather than an integration test against a
  live API — there is no Stripe-CLI-style local-signing equivalent for
  Cloudflare's playback tokens (minting one is a real API call, not a
  locally-computable HMAC). The token route's `404`/`403`/`502` paths were
  each verified by hand against a running dev server with fake
  credentials, confirming the real request reaches (and is correctly
  rejected by) the blocked network rather than short-circuiting.

## Course authoring tool (phase 9)

`/admin/courses/[id]` grew from status/instructor/enrollment management
into a full editor: every `Course` field (with a cover image, served
publicly from its own `course-covers` prefix — see "Video (phase 8)" for
why lesson resources can't just reuse `/api/files` for this), and a
module/lesson builder (add/rename/reorder/delete, both levels) whose
per-lesson editor covers type, Markdown body, transcript, free-preview,
video (`VideoUploadPanel`, reused from phase 8), and resources (`AddResourceForm`/
`DeleteResourceButton`, reused from the professor route unchanged —
`canManageCourse` already allows ADMIN).

- A lesson `body` is Markdown, rendered as such via `LessonBody`
  (`react-markdown`, no `rehype-raw`) everywhere a learner sees it — not
  a schema change, `body` was always free text; only the authoring
  convention and the rendering changed.
- Publishing is validated, not just toggled:
  `updateCourseStatusAction` refuses `DRAFT` → `PUBLISHED` with a
  specific reason (no lessons / no price / no free-preview lesson),
  checking all three rather than stopping at the first.
- Duplicate deep-clones modules and lessons (including `videoUid`) as a
  new `DRAFT`, never auto-published. `/admin/learners` and
  `/admin/purchases` fill in the two inert placeholder tiles
  (`RolePanel`'s "Enrollment"/"Finances") that had sat there since the
  dashboard was first built.
- Reorder is up/down buttons only, not drag-and-drop — "reorder by drag
  or by up/down buttons" was read as offering a choice of mechanism, and
  buttons are simpler, need no new dependency, and are keyboard-operable
  by construction; every builder control got a real `htmlFor`-linked
  label as part of this (several had none before).

## Certificates and quizzes (phase 10)

Completing a course's last lesson (`markLessonComplete`,
`src/lib/progress.ts`) now stamps `Enrollment.completedAt`, issues a
certificate, and emails it — the certificate/email step is wrapped in
try/catch so it can never turn "Mark complete" into a visible error; the
enrollment is completed regardless of what happens after.

- `src/lib/certificate.ts` is the one place certificate data/rendering
  live — mirrors `entitlements.ts`/`video.ts`'s "one place, everything
  else defers to it" shape. `issueCertificate` is idempotent
  (`Enrollment.certificateStorageKey`, added alongside the pre-existing
  but previously-unused `certificateIssuedAt`, is the record of an
  already-issued one). PDF rendering is `pdfkit`, drawing the same data
  the HTML page shows — not a headless-browser screenshot of the page,
  which would need a dependency (Playwright/Puppeteer + bundled
  Chromium) this app doesn't otherwise carry.
- `CERTIFICATE_ISSUER_NAME`/`CERTIFICATE_ISSUER_LICENSE_NUMBER` have no
  plausible default — left unset, a certificate says so plainly rather
  than showing invented credentials, the same "don't guess, say so"
  instinct as `NEXT_PUBLIC_VIDEO_EMBED_BASE` before Stream and
  `stripeConfigured`/`streamConfigured` before them.
- `Quiz`/`QuizQuestion` attach to a `Module` (one quiz per module).
  Untimed, unlimited attempts, never scored, never gates progress or the
  certificate — `QuizPlayer.tsx` holds nothing but local `useState`, no
  network calls at all. A quiz is only reachable through a `QUIZ`-type
  lesson in the same module — the pre-existing lesson-type slot this
  phase filled in, not a new display surface.

## Known loose ends

- There is no logo asset. `src/components/shell/Wordmark.tsx` renders a
  text wordmark; swap real artwork in there when it exists.
- `docs/screenshots/` was removed as stale; regenerate if screenshots are
  wanted in the README again.
- Route segments still read `professor`/`student`
  (`/professor/courses/[id]`, `/student/courses/[id]`), even though the
  roles and `Course.instructorId` were renamed. Changing the URLs is a
  separate, breaking change.
- `EnrollmentSource.BUNDLE` is still unused; only `PURCHASE` (checkout) and
  `COMP` (an admin granting access by hand) create enrollments so far.
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
