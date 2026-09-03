# Olive Institute

A self-hosted storefront for self-paced courses. An admin creates accounts
and courses, assigns an instructor to each, and enrolls learners;
instructors publish course materials (PDFs, links, videos); learners sign in
and work through the materials at their own pace.

There is no cohort machinery — no assignments, submissions, grading,
attendance, credit tracking, class schedule, or in-app messaging. Courses
are always-available content, not live classes.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL via Prisma ORM (pinned to Prisma 6 — see note
  below)
- **Auth:** NextAuth.js v5 (Auth.js) with a Credentials provider, JWT
  sessions, and a `role` field (`ADMIN` | `INSTRUCTOR` | `LEARNER`) exposed
  on the session. Passwords are hashed with bcrypt.
- **File storage:** local disk, abstracted behind a `StorageService`
  interface (`src/lib/storage.ts`) so swapping to S3 is a config change.
- **Email:** abstracted behind an `EmailService` interface
  (`src/lib/email.ts`); logs to console in dev, sends via Resend when
  `RESEND_API_KEY` is set. Nothing in the app sends mail today — the
  interface is kept for password handoff and future transactional mail.

### Why Prisma 6, not 7

Prisma 7 removed `datasource { url = env(...) }` support and requires
wiring a driver adapter (`@prisma/adapter-pg` + `pg`) into every
`PrismaClient` construction. That adds indirection for no benefit at this
scale, so we stay on Prisma 6 and the standard `new PrismaClient()` +
`DATABASE_URL` pattern. Revisit if moving to serverless/edge Postgres.

## Data model

In `prisma/schema.prisma`:

- `User` — name, email, bcrypt password hash, role, `emailVerifiedAt`
- `Course` — a sellable product: `slug`, title, subtitle, `track`
  (CLINICIAN / PUBLIC), `priceCents`, `status` (DRAFT / PUBLISHED /
  ARCHIVED), `estimatedMinutes`, `sortOrder`, Stripe price id, owning
  instructor
- `Module` — an ordered section of a course
- `Lesson` — an ordered unit inside a module: `type` (VIDEO / TEXT / PDF /
  QUIZ), `durationSeconds`, `isFreePreview`, plus video uid, body, and
  transcript. Unique on `moduleId` + `slug`
- `LessonResource` — a PDF, link, or video attached to a lesson
- `Enrollment` — the grant of access: `source` (PURCHASE / COMP / BUNDLE),
  optional `purchaseId`, `grantedAt`, `completedAt`, `certificateIssuedAt`.
  Unique on `userId` + `courseId`
- `Purchase` — a Stripe checkout: session id (unique), payment intent,
  `amountCents`, `currency`, `status` (PENDING / PAID / REFUNDED / FAILED)
- `LessonProgress` — per learner, per lesson: `completedAt` and
  `lastPositionSeconds`, plus `createdAt`/`updatedAt`. Unique on `userId` +
  `lessonId`. `updatedAt` is what "most recently accessed" ordering on
  `/my-courses` and the position-save throttle are both computed from

## The storefront

`/`, `/clinicians`, `/explore`, and `/courses/[slug]` render for logged-out
visitors. Only PUBLISHED courses are ever listed or reachable — every
listing goes through `listPublishedCourses` in `src/lib/catalog.ts`, and the
sales page queries `{ slug, status: PUBLISHED }`, so a DRAFT or ARCHIVED
slug is a 404. People who own an archived course still reach it through
`/student/courses/[id]`.

The free preview lesson plays inline with no account. Whether it may be
shown is `canViewLesson`'s decision, not the page's — the sales page never
reads `isFreePreview` to gate anything, so a logged-out visitor and a
signed-in one go through exactly the same rule.

The free preview's own video plays through Cloudflare Stream — see
"Video (Cloudflare Stream)" below. Set `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_STREAM_TOKEN`; until both are set, the preview says so rather
than rendering a broken frame.

### SEO

Every public page sets a title, description, canonical URL, and Open Graph
tags; the sales page pulls them from the Course record. `metadataBase` comes
from `NEXT_PUBLIC_SITE_URL` (falling back to `NEXTAUTH_URL`), so canonical
and `og:url` are absolute and carry the base path.

There is deliberately no root `loading.tsx`. One used to exist, and its
Suspense boundary made Next flush a `200` shell before the page resolved, so
every `notFound()` in the app rendered the 404 page under a 200 status — a
soft 404 that crawlers index. Re-adding one at the root would reintroduce
that; scope any loading UI to a segment that never calls `notFound()`.

## Access control

`src/lib/entitlements.ts` is the single place any code asks whether someone
may see something. It exports two functions:

- `hasAccess(userId, courseId)` — an admin sees everything; a course's own
  instructor sees that course at any status; anyone else needs an
  enrollment and the course must not be a DRAFT. ARCHIVED still grants
  access, because archiving retires a course from the storefront rather
  than revoking what people already own.
- `canViewLesson(userId, lessonId)` — course access, or a lesson flagged
  `isFreePreview` on a PUBLISHED course.

Both deny by default: an unknown user, course, or lesson is `false`, never
an error. Nothing else should reason about enrollments, course status, or
free previews to make an access decision — `/api/files` and the learner
course page both call these rather than deciding for themselves.

## Design system

Tokens live in `src/app/globals.css`. Six brand colors — deep olive
`#3F4F33`, sage `#7E9068`, pale sage `#EDF0E8`, warm ivory `#FAF8F2`,
terracotta `#A0553A`, muted gold `#A98B4F` — plus hover/gradient/type steps
derived from them. Headings use Cormorant Garamond (`font-heading`); body
and UI text use DM Sans (`font-body`). There is deliberately no
`font-serif` utility, so a class name can't drift from the face it renders.

`/style-guide` renders every token and shared component in isolation; it is
the fastest way to check a change against the whole system.

There is no logo asset — `src/components/shell/Wordmark.tsx` is a text
wordmark, and is the one place to swap artwork in when it exists.

## Base path

The app is mounted under `/institute` (`basePath` in `next.config.ts`,
sourced from `src/lib/basePath.ts`). The Auth.js session cookie is scoped to
that path too, so nothing outside the app ever receives the token.

`next/link`, `next/image`, `useRouter`, and `redirect()` prepend the prefix
themselves. Three things do not, and use `withBasePath()` instead:

- `NextResponse.redirect` in `src/proxy.ts`, which takes a full URL
- Auth.js `redirectTo` / `pages.signIn`, resolved against the origin
- `<a href>` to a stored file URL, and `next/image` sources from `public/`

Sign-in runs through a Server Action (`src/app/login/actions.ts`) rather
than `next-auth/react`, because the client helper builds its request URL
from `NEXTAUTH_URL` and ignores the base path.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill it in:

   ```bash
   cp .env.example .env
   ```

   A `docker-compose.yml` is included for Postgres if you don't already
   have a local server running:

   ```bash
   docker compose up -d
   ```

3. Apply migrations:

   ```bash
   npm run db:migrate
   ```

4. Create the admin account. **`SEED_ADMIN_EMAIL` and
   `SEED_ADMIN_PASSWORD` must be set** — the seed aborts with a nonzero
   exit if either is missing. There are no demo accounts and no default
   credentials.

   ```bash
   npm run db:seed
   ```

   The seed is idempotent. It resets the named admin's name, password, and
   role to whatever the environment currently says, and rebuilds two
   published catalogue courses — one CLINICIAN, one PUBLIC — each with two
   modules and five lessons whose first lesson is the free preview.

5. Run it:

   ```bash
   npm run dev
   ```

   Sign in at `/login` with the seeded admin; you land on `/dashboard`.
   Anyone can create their own account at `/register` — accounts are
   self-service, not admin-issued. An admin can still create one directly
   from `/admin/users`; either way the new user sets their own password by
   following an emailed link, so no temporary password ever passes through
   anyone else's hands.

## Routes

Every route is served under the `/institute` base path — `/dashboard` is
reached at `/institute/dashboard`. The table lists app-relative paths.

The storefront is public; everything else requires a session. `proxy.ts`
holds an allowlist of the *protected* areas, so a new route is public unless
it is added there.

| Route | Who |
| --- | --- |
| `/` | anyone — storefront home, split by track |
| `/clinicians` | anyone — catalogue filtered to CLINICIAN |
| `/explore` | anyone — catalogue filtered to PUBLIC |
| `/courses/[slug]` | anyone — sales page; only PUBLISHED slugs resolve |
| `/login` | anyone |
| `/register` | anyone — self-service sign-up, always creates a LEARNER |
| `/verify-email/[token]` | anyone with the link — confirms the account's email |
| `/forgot-password`, `/reset-password/[token]` | anyone — request and redeem a reset link |
| `/dashboard` | any signed-in user; content varies by role |
| `/settings` | any signed-in user — profile, password, purchase history |
| `/my-courses` | any signed-in user — every enrollment, percent complete, "continue where you left off" |
| `/learn/[courseSlug]` | `hasAccess` — resolves the continue lesson and redirects |
| `/learn/[courseSlug]/[lessonSlug]` | `canViewLesson` — the player; open to a logged-out visitor for a free preview |
| `/admin/users` | ADMIN — create accounts (emails an invite), send reset links |
| `/admin/courses`, `/admin/courses/[id]` | ADMIN — create, edit, duplicate, archive courses; the module/lesson builder; assign an instructor; enroll/unenroll |
| `/admin/learners`, `/admin/learners/[id]` | ADMIN — search learners, review enrollments, grant comp access |
| `/admin/purchases` | ADMIN — every transaction, plus revenue by month |
| `/professor/courses/[id]` | course's instructor or ADMIN — curriculum, lesson resources, enroll learners |
| `/student/courses/[id]` | any signed-in user — curriculum, gated per lesson by `canViewLesson` |
| `/checkout/success`, `/checkout/cancel` | any signed-in user — reads a `Purchase`, never writes access |
| `/api/checkout` | verified, signed-in user — starts a Stripe Checkout Session |
| `/api/webhooks/stripe` | Stripe only, verified by signature — the only place access is granted |
| `/api/files/[...key]` | readers a lesson resource is visible to |
| `/api/stream/token/[videoUid]` | `canViewLesson` — mints a 2h signed Stream playback token |
| `/style-guide` | design-system reference |

## Accounts

Accounts are self-service. `/register` takes a name, email, password, and
explicit checkboxes for the terms of service and privacy policy; it always
creates a `LEARNER` — anything more privileged is an admin's decision at
`/admin/users`, which now emails an invitation link instead of generating a
temporary password, so an invitee is the only one who ever holds their own
password.

**Email verification** doesn't gate signing in or browsing — only buying.
`src/lib/entitlements.ts`'s `canPurchase` is where that rule lives; the
sales page's CTA and `POST /api/checkout` both defer to it rather than
re-checking `emailVerifiedAt` themselves. An unverified account resends its
confirmation email from `/settings`.

**Password reset and email verification** both use `src/lib/tokens.ts`: a
random 256-bit token is emailed, and only its SHA-256 hash is stored, so a
leaked database row can't be replayed as a working link. Reset tokens expire
in one hour and are single-use — redeeming one also retires every other
outstanding token for that user, so an older email in an inbox goes dead
too. `/forgot-password` gives the same response whether or not the address
has an account, so the form can't be used to enumerate who is registered.

**Password strength** is enforced by `src/lib/password.ts` everywhere a
password gets set — registration, reset, and change-password all call the
same `validatePassword`. It rejects anything under 10 characters, a single
character class, common patterns, and passwords built from the account's own
name or email; a long passphrase with some variety clears it easily. The
client-side meter is a preview of the same scoring, not a separate check.

**Rate limiting** (`src/lib/rateLimit.ts`) applies to registration and
password-reset requests, counted by both the caller's IP and the target
email against an hourly budget, backed by rows in `rate_limit_hits` rather
than an in-memory counter so a restart doesn't hand out a fresh one.

In development, set `EMAIL_CAPTURE_DIR` to have every sent email also
written to disk as JSON — the Playwright suite reads these to follow real
verification and reset links. Never set it in production.

## Payments

One-time, per-course purchases via [Stripe Checkout](https://stripe.com/docs/payments/checkout).
There is no subscription billing and no cart — one course, one payment.

**The flow:**

1. The sales page's Buy button (`src/components/storefront/BuyButton.tsx`,
   the one client-side fetch in an otherwise Server-Action-first codebase —
   `/api/checkout` is a real REST endpoint, not a Server Action) posts to
   `POST /api/checkout` with a `courseId` and follows the Stripe-hosted URL
   it returns.
2. `POST /api/checkout` calls `canPurchase` — the same rule the sales
   page's CTA is built from — creates a Stripe Checkout Session (`mode:
   "payment"`, `price_data` built from `Course.priceCents`/`title`,
   `client_reference_id` and `metadata` set to the buyer's `userId` and the
   `courseId`), and writes a `PENDING` `Purchase` row keyed on the returned
   session id.
3. The buyer pays on Stripe's hosted page, which redirects back to
   `/checkout/success?session_id=…` (or `/checkout/cancel` if they back
   out — nothing was charged either way).
4. Independently, Stripe delivers a `checkout.session.completed` webhook to
   `POST /api/webhooks/stripe`. **This is the only place a purchase turns
   into access** — see the CRITICAL callout below.

**`POST /api/webhooks/stripe`** reads the raw request body (`request.text()`,
never `request.json()` — signature verification is over the exact bytes
Stripe sent) and verifies it with `stripe.webhooks.constructEvent` using
`STRIPE_WEBHOOK_SECRET` before trusting anything in it.

- `checkout.session.completed` looks up the `Purchase` by
  `stripeCheckoutSessionId`, marks it `PAID`, and `upsert`s an `Enrollment`
  (`source: PURCHASE`) on the `(userId, courseId)` unique constraint — all
  inside one transaction. The upsert is what makes a replayed delivery a
  no-op: Stripe redelivers events at least once, including after a
  delivery that already succeeded, so this must never depend on only
  running once. A receipt email goes out after the transaction commits,
  guarded by the same "already PAID" check so a replay doesn't send it
  twice.
- `charge.refunded` marks the `Purchase` `REFUNDED` and removes the
  `Enrollment` it granted (`deleteMany`, not `delete` — idempotent under a
  replay once the row is already gone).

**CRITICAL: access is granted only in the webhook, never on
`/checkout/success`.** That page reads the local `Purchase.status` — set
exclusively by the webhook — to decide what to show; it never creates or
upserts anything itself. Reaching that URL only proves Stripe redirected
the browser there, not that the payment is real or that the event has been
verified. If the webhook hasn't landed yet by the time the browser is
redirected back (normally near-instant), the success page shows a
"finishing up" state with a plain `<meta http-equiv="refresh">` rather than
guessing that payment succeeded.

**Configuration:** set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
`src/lib/stripe.ts` exports `stripeConfigured` (true only when a real
secret key is set); every route that can reach Stripe's API checks it
first, so `next build` never needs a live key to succeed, and an
unconfigured deployment fails with one clear message rather than a
cryptic error later.

**Not yet wired:** `EnrollmentSource.BUNDLE` (buying more than one course at
a time).

## The learner experience

`/my-courses`, `/learn/[courseSlug]`, and `/learn/[courseSlug]/[lessonSlug]`
are the player. `src/lib/progress.ts` is the one place that computes
progress — percent complete, "most recently accessed" ordering, which lesson
"continue where you left off" resolves to, and the position-save throttle —
the same role `entitlements.ts` plays for access.

- **`/my-courses`** lists every `Enrollment`, each with a percent complete
  (`LessonProgress.completedAt` rows over the course's lesson count) and a
  "continue where you left off" link resolved by
  `resolveContinueLessonSlug` — whichever lesson the learner most recently
  touched (by `LessonProgress.updatedAt`), or the first lesson if they never
  have. Sorted by that same recency, falling back to `Enrollment.grantedAt`
  for a course with no activity yet.
- **`/learn/[courseSlug]`** is gated by `hasAccess` and immediately redirects
  to the continue lesson; it renders nothing of its own. Its
  `layout.tsx` is the actual player shell — a persistent, module-grouped
  lesson sidebar shared by both routes underneath it. The layout itself
  enforces no access rule beyond keeping a DRAFT/ARCHIVED course's structure
  from leaking to someone who couldn't otherwise see it (the same rule the
  sales page uses); each page below it decides its own gating, because the
  two have different rules (see next point).
- **`/learn/[courseSlug]/[lessonSlug]`** is gated by `canViewLesson`, not
  `hasAccess` — a logged-out visitor can reach a course's free preview
  lesson here the same as on the sales page. Every lesson type renders in
  one page: `VIDEO` gets the player below; `TEXT` renders `Lesson.body`;
  `PDF`'s content is its attached `LessonResource` downloads (there is no
  separate PDF body field); `QUIZ` renders an honest placeholder — there is
  no question/answer schema yet. Every lesson also gets its transcript
  (`Lesson.transcript`, when set), its resources (`ResourceList`, reused
  from the professor/student pages), and previous/next links walked from
  `getOrderedLessons`. Resume position, the completed checkmark, and the
  Mark complete button all require `hasAccess`, not just `canViewLesson` —
  they're an enrolled-learner feature, not something a free-preview visitor
  who hasn't bought the course gets.
- **Completion is explicit, never inferred.** `markLessonComplete` (called
  by `markLessonCompleteAction` in the lesson route's `actions.ts`) only
  ever runs from the learner's own "Mark complete" click. When it completes
  the last remaining lesson in the course, it also stamps
  `Enrollment.completedAt` — nothing else in the app sets that field. There
  is deliberately no autoplay, no auto-advance on video end, no streaks, and
  no timers anywhere in this feature.
- **Position autosave is throttled twice.** `VideoPlayer`
  (`src/components/learn/VideoPlayer.tsx`) calls
  `saveLessonPositionAction` from a `timeupdate` handler, itself
  client-throttled to once per ten seconds — but the real enforcement is
  server-side, in `saveLessonPosition` (`src/lib/progress.ts`): it reads the
  existing row's `updatedAt` and silently drops the write if under ten
  seconds old, so a client that ignored its own throttle still couldn't
  write more often. It never touches `completedAt`. `progress.integration.test.ts`
  proves the throttle by backdating a row's `updatedAt` directly (via raw
  SQL) rather than waiting ten real seconds.
- **`src/components/video/VideoPlayer.tsx` is the one video player**,
  shared by the learner lesson page (`trackProgress` true, with resume) and
  the sales page's `LessonPreview` (`trackProgress` false — there's no
  account to save a free preview's position against). It plays through
  Cloudflare Stream; see "Video (Cloudflare Stream)" below for how.

## Video (Cloudflare Stream)

Lesson video is hosted on [Cloudflare Stream](https://developers.cloudflare.com/stream/).
`src/lib/video.ts` wraps its REST API behind `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_STREAM_TOKEN`, exporting `streamConfigured` the same way
`stripe.ts` exports `stripeConfigured` — every route and Server Action that
can reach Stream's API checks it first, so `next build` never needs live
credentials and an unconfigured deployment fails with one clear message
instead of a broken player.

**Every video requires a signed playback URL.** Uploads are created with
`requireSignedURLs: true` (`createDirectUploadUrl`), so a bare video uid is
never enough to play one — `GET /api/stream/token/[videoUid]` is the only
way to get a token. It resolves the lesson by `videoUid`, runs the same
`canViewLesson` check every other lesson-gated route runs, and mints a
two-hour token (`mintPlaybackToken`) if allowed, `403` if not, `404` if the
video doesn't belong to any lesson. `VideoPlayer` fetches its own token
client-side from this route rather than being handed one by the server
component that renders it — the token expires, and the player doesn't know
in advance how long the page will stay open.

**Uploading, from `/admin/courses/[id]`:** each `VIDEO`-type lesson gets a
`VideoUploadPanel`. Choosing a file calls `createVideoUploadAction`, which
asks Stream for a one-time `direct_upload` URL and immediately stores the
returned uid on `Lesson.videoUid` — before anything has actually uploaded,
so a lesson mid-upload is already linked to it. The browser then `POST`s
the file straight to that URL; **the file never passes through this
server.** Once that upload request resolves, the panel bounded-auto-polls
(a chained `setTimeout`, capped at 45 tries ~4s apart, never a bare
`setInterval`) `checkVideoStatusAction`, which asks Stream whether the
video has finished processing and, once it has, writes the real
`durationSeconds` back onto the lesson and requests automatic captions
(`generateCaptions`) — a no-op if a caption track already exists, so it's
safe to call on every poll rather than tracking "did we already ask"
separately. The panel then polls `checkCaptionStatusAction` the same way
until the caption track reports generated, fetches its WebVTT, and stores
the plain text (via the pure, unit-tested `vttToPlainText`) onto
`Lesson.transcript` — the same field the lesson page already renders as a
"Transcript" section. A manual "Check now" button covers the case where an
admin navigates away and back before a bounded poll finishes.

**Captions are exposed automatically.** Once Stream has processed a
caption track, its own Player web component surfaces a CC toggle with no
extra wiring on this app's side — `vttToPlainText`'s job is only to get the
same content onto the page as plain text, not to render the track itself.

**The player itself** (`VideoPlayer`) loads Cloudflare's Stream Player web
component script once per page and renders a `<stream>` custom element
(typed by hand in `src/types/stream-element.d.ts`, since it isn't a
browser-standard element and React's automatic JSX runtime resolves
`JSX.IntrinsicElements` from the `"react"` module rather than the bare
global namespace). It never sets `autoplay` — the type that element's
props are declared with doesn't even have that attribute, a small extra
guard against ever adding it by accident. Speed (0.5x–2x, a native
`<select>`, so it's keyboard-operable for free) is remembered in
`localStorage` and reapplied via the element's `playbackRate` property on
`loadedmetadata`.

**On the network constraint:** as with Stripe (see "Payments" above), this
environment's outbound egress blocks `api.cloudflare.com`, so `video.ts`'s
API-calling functions are covered by unit tests against a mocked `fetch`
(`src/lib/__tests__/video.test.ts`) rather than a real account — proving
the request shape (URL, auth header, body) and response parsing, not that
Cloudflare accepts them. `vttToPlainText` is pure and network-free, so it
gets real test coverage. The token route's error paths (`404`, `403`, and
the `502` a real API call failure produces) were each verified by hand
against a running dev server with fake credentials.

## The course authoring tool

`/admin/courses` lists every course — track, status, price, enrollment
count, and revenue (summed from `PAID` `Purchase` rows) — with Duplicate
and Archive actions inline. `/admin/courses/[id]` is where a course
actually gets built:

- **Course details** edits every `Course` field, including a slug
  uniqueness check (against every *other* course — a course keeping its
  own slug isn't a conflict with itself), price entered in dollars and
  converted to `priceCents`, and a cover image upload. A cover image is
  served publicly, unlike a lesson resource: `GET
  /api/course-covers/[...key]` has no entitlement check, because the
  storefront and an Open Graph crawler both need to load it with no
  session. It lives under its own `course-covers` prefix in
  `UPLOADS_DIR`, entirely separate from lesson resources, so the route
  can never be tricked into serving one of those instead. Once set, it
  renders as a banner on the sales page and as `og:image`.
- **The module/lesson builder** (`CourseBuilder.tsx` +
  `course-builder-actions.ts`) supports add, rename, reorder (up/down
  buttons — every control has a real, `htmlFor`-linked label, so it's
  fully keyboard operable), and delete-with-confirmation (a
  `window.confirm()`, matching how this app does every other destructive
  click) for both modules and lessons. Reordering swaps `sortOrder` with
  the adjacent sibling in a transaction rather than renumbering the whole
  list.
- **Each lesson's editor** covers type, a Markdown body, transcript,
  `isFreePreview`, its video (the same `VideoUploadPanel` from the
  Cloudflare Stream phase), and its `LessonResource` files (the
  professor route's `AddResourceForm`/`DeleteResourceButton`, reused
  as-is — `canManageCourse` already allows ADMIN, so no new action was
  needed). A lesson's `body` is authored as Markdown and rendered as such
  everywhere a learner sees it — `LessonBody`
  (`src/components/course/LessonBody.tsx`), a thin `react-markdown`
  wrapper — rather than as an inert wall of asterisks and hash marks.
  `react-markdown` parses straight to React elements (no `rehype-raw`,
  no `dangerouslySetInnerHTML`), so raw HTML in a lesson body is never
  rendered — safe by construction, not by sanitizing.
- **Publishing is blocked with a specific reason** — `updateCourseStatusAction`
  refuses a `DRAFT` → `PUBLISHED` transition and says exactly which of "no
  lessons", "no price", or "no free-preview lesson" is missing, checking
  all three rather than stopping at the first.
- **Preview** is a plain `target="_blank"` link to the real sales page —
  worth knowing that an admin visiting their own course's sales page
  always sees the "Go to course" CTA a real visitor would not, since
  `hasAccess` is unconditionally true for an admin; everything else on
  the page (title, description, curriculum, the free preview) is
  identical to what a visitor sees.
- **Duplicate** deep-clones a course's modules and lessons (including
  each lesson's `videoUid`, so the copy plays right away) as a new
  `DRAFT` — never auto-published — under a `-copy`/`-copy-2`/… slug.
  Enrollments, purchases, and progress belong to the original, not the
  copy.
- **`/admin/learners`** searches by name or email;
  `/admin/learners/[id]` shows one learner's enrollments and a form to
  grant comp access — the same `Enrollment` a course page's "Enroll a
  learner" form creates, reached from the learner's side instead of the
  course's.
- **`/admin/purchases`** lists every transaction (whatever it settled
  as, not just `PAID`) and totals `PAID` amounts by month.

## Authorization

Every protected page and Server Action calls `requireSession` /
`requireRole` from `src/lib/rbac.ts` as its first statement — the proxy
(`src/proxy.ts`) only does a thin cookie-presence check, so authorization
never depends on it alone.

`/api/files/[...key]` re-checks per request: it resolves the key to a
`LessonResource`, then defers to `canViewLesson` — it never decides for
itself who may read a file. Uploads live outside `public/`, so they are
never served unauthenticated by the static file server.

## Testing

```bash
npm run test              # unit + integration + e2e
npm run test:unit         # vitest, no database needed
npm run test:integration  # vitest against DATABASE_URL — any *.integration.test.ts
npm run test:e2e          # playwright
```

The integration suite exercises `entitlements.ts`, `progress.ts`, and the
Stripe webhook handler against a real database because all three are
queries/transactions — stubbing them would only test the stub; each cleans
up its own fixtures. The position-save throttle test backdates a
`LessonProgress` row's `updatedAt` with a raw SQL `UPDATE` rather than
waiting ten real seconds.
The webhook tests (and `tests/checkout.spec.ts`) also need
`STRIPE_WEBHOOK_SECRET` set — any string works, since nothing in them calls
Stripe's API, only its local, no-network signing/verification helpers.
`src/lib/__tests__/video.test.ts` is a plain unit test (`test:unit`, not
`test:integration`) — Cloudflare's API needs real credentials no local
signing trick can substitute for, so it mocks `fetch` instead; see "Video
(Cloudflare Stream)" above.

The Playwright suite reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and
fails fast if they are unset, so it exercises the account that was actually
seeded. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Playwright's bundled
Chromium isn't available in your environment.

## Deploying

Auth.js v5 needs explicit host trust outside Vercel; `src/lib/auth.ts` sets
`trustHost: true`. Without it every request in a production build fails
with `UntrustedHost`. Set a strong `NEXTAUTH_SECRET` and a correct
`NEXTAUTH_URL`, and put the app behind a reverse proxy you control.
