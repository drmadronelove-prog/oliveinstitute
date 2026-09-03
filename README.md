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
  `lastPositionSeconds`. Unique on `userId` + `lessonId`

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

Set `NEXT_PUBLIC_VIDEO_EMBED_BASE` to the video host's embed URL; a lesson's
`videoUid` is appended to it. Until it is set, the preview says so rather
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
   Create further accounts from `/admin/users`, which generates a
   temporary password to hand over out of band — there is no public
   sign-up.

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
| `/dashboard` | any signed-in user; content varies by role |
| `/admin/users` | ADMIN — create accounts, reset passwords |
| `/admin/courses`, `/admin/courses/[id]` | ADMIN — create courses, assign an instructor, enroll/unenroll |
| `/professor/courses/[id]` | course's instructor or ADMIN — curriculum, lesson resources, enroll learners |
| `/student/courses/[id]` | any signed-in user — curriculum, gated per lesson by `canViewLesson` |
| `/settings/password` | any signed-in user |
| `/api/files/[...key]` | readers a lesson resource is visible to |
| `/style-guide` | design-system reference |

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
npm run test:integration  # vitest against DATABASE_URL — the entitlement rules
npm run test:e2e          # playwright
```

The integration suite exercises `entitlements.ts` against a real database
because the rules are all queries — stubbing them would only test the stub.
It creates and removes its own fixtures.

The Playwright suite reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and
fails fast if they are unset, so it exercises the account that was actually
seeded. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Playwright's bundled
Chromium isn't available in your environment.

## Deploying

Auth.js v5 needs explicit host trust outside Vercel; `src/lib/auth.ts` sets
`trustHost: true`. Without it every request in a production build fails
with `UntrustedHost`. Set a strong `NEXTAUTH_SECRET` and a correct
`NEXTAUTH_URL`, and put the app behind a reverse proxy you control.
