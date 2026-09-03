-- Adds createdAt/updatedAt to lesson_progress. updatedAt is what
-- "most recently accessed course" ordering on /my-courses is computed
-- from, and what the position-save Server Action throttles writes against.
--
-- No default on updatedAt, matching every other @updatedAt column in this
-- schema (Prisma Client sets it explicitly on every write, never a DB-level
-- default) — safe here specifically because lesson_progress has been empty
-- since it was created: nothing wrote to it before this phase. A NOT NULL
-- column with no default on a populated table would need the usual
-- nullable-then-backfill-then-constrain treatment instead.

-- AlterTable
ALTER TABLE "lesson_progress"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "lesson_progress_userId_updatedAt_idx" ON "lesson_progress"("userId", "updatedAt");
