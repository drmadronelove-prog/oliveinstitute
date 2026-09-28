-- Courses gain a flat list of instructors, replacing the single
-- `courses.instructorId`.
--
-- Written to be safe on a populated database, in the order that matters:
-- the join table is created and backfilled from the existing column
-- FIRST, and only then is the column dropped. Reversing those two steps
-- would lose every course's instructor.

-- CreateTable
CREATE TABLE "course_instructors" (
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_instructors_pkey" PRIMARY KEY ("courseId","userId")
);

-- CreateIndex
CREATE INDEX "course_instructors_userId_idx" ON "course_instructors"("userId");

-- CreateIndex
CREATE INDEX "course_instructors_courseId_sortOrder_idx" ON "course_instructors"("courseId", "sortOrder");

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: every course's existing instructor becomes its first (and for
-- now only) entry in the list. Runs before the column is dropped.
INSERT INTO "course_instructors" ("courseId", "userId", "sortOrder", "createdAt")
SELECT "id", "instructorId", 0, CURRENT_TIMESTAMP
FROM "courses"
WHERE "instructorId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_instructorId_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "instructorId";
