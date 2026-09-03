# Olive Institute

A self-hosted storefront for self-paced courses. An admin creates accounts
and courses, assigns a professor to each, and enrolls students; professors
publish course materials (PDFs, links, videos); students sign in and work
through the materials at their own pace.

There is no cohort machinery — no assignments, submissions, grading,
attendance, credit tracking, class schedule, or in-app messaging. Courses
are always-available content, not live classes.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL via Prisma ORM (pinned to Prisma 6 — see note
  below)
- **Auth:** NextAuth.js v5 (Auth.js) with a Credentials provider, JWT
  sessions, and a `role` field (`ADMIN` | `PROFESSOR` | `STUDENT`) exposed
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

Four tables, in `prisma/schema.prisma`:

- `User` — name, email, bcrypt password hash, role
- `Course` — title, description, term, credits, owning professor
- `Enrollment` — a user in a course (unique on `userId` + `courseId`)
- `CourseMaterial` — PDF, link, or video attached to a course

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

   The seed is idempotent: re-running it resets the named admin's name,
   password, and role to whatever the environment currently says.

5. Run it:

   ```bash
   npm run dev
   ```

   Sign in at `/login` with the seeded admin; you land on `/dashboard`.
   Create further accounts from `/admin/users`, which generates a
   temporary password to hand over out of band — there is no public
   sign-up.

## Routes

| Route | Who |
| --- | --- |
| `/login` | anyone |
| `/dashboard` | any signed-in user; content varies by role |
| `/admin/users` | ADMIN — create accounts, reset passwords |
| `/admin/courses`, `/admin/courses/[id]` | ADMIN — create courses, assign a professor, enroll/unenroll |
| `/professor/courses/[id]` | course's professor or ADMIN — materials, enroll students |
| `/student/courses/[id]` | enrolled student — read-only materials |
| `/settings/password` | any signed-in user |
| `/api/files/[...key]` | authorized readers of a course material |
| `/style-guide` | design-system reference |

## Authorization

Every protected page and Server Action calls `requireSession` /
`requireRole` from `src/lib/rbac.ts` as its first statement — the proxy
(`src/proxy.ts`) only does a thin cookie-presence check, so authorization
never depends on it alone.

`/api/files/[...key]` re-checks per request: it resolves the key to a
`CourseMaterial` row and allows an admin, the owning professor, or an
enrolled student. Uploads live outside `public/`, so they are never served
unauthenticated by the static file server.

## Testing

```bash
npm run test        # unit + e2e
npm run test:unit   # vitest
npm run test:e2e    # playwright
```

The Playwright suite reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and
fails fast if they are unset, so it exercises the account that was actually
seeded. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if Playwright's bundled
Chromium isn't available in your environment.

## Deploying

Auth.js v5 needs explicit host trust outside Vercel; `src/lib/auth.ts` sets
`trustHost: true`. Without it every request in a production build fails
with `UntrustedHost`. Set a strong `NEXTAUTH_SECRET` and a correct
`NEXTAUTH_URL`, and put the app behind a reverse proxy you control.
