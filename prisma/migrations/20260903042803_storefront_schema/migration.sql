-- Rebuild the schema around a self-paced course storefront: courses are
-- sellable products made of modules and lessons, access is granted by an
-- enrollment (bought, comped, or bundled), and progress is per lesson.
--
-- Written to be safe on a populated database: every new NOT NULL column is
-- added nullable, backfilled, then constrained. The one unavoidable loss is
-- `course_materials` — resources now hang off a lesson, and there is no
-- lesson to attach a course-level material to.

-- CreateEnum
CREATE TYPE "Track" AS ENUM ('CLINICIAN', 'PUBLIC');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'TEXT', 'PDF', 'QUIZ');

-- CreateEnum
CREATE TYPE "EnrollmentSource" AS ENUM ('PURCHASE', 'COMP', 'BUNDLE');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- DropForeignKey
ALTER TABLE "course_materials" DROP CONSTRAINT "course_materials_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_materials" DROP CONSTRAINT "course_materials_uploadedById_fkey";

-- DropTable
-- Resources are per-lesson now; a course-level material has no lesson to
-- move to, so this table cannot be migrated forward.
DROP TABLE "course_materials";

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- AlterTable: courses — drop the cohort-era columns
ALTER TABLE "courses" DROP COLUMN "credits",
DROP COLUMN "meetingTimes",
DROP COLUMN "term";

-- Rename rather than drop-and-add, so the owning instructor survives.
ALTER TABLE "courses" DROP CONSTRAINT "courses_professorId_fkey";
ALTER TABLE "courses" RENAME COLUMN "professorId" TO "instructorId";
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: courses — storefront columns. Nullable, backfilled, then NOT NULL.
ALTER TABLE "courses" ADD COLUMN "coverImageKey" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "stripePriceId" TEXT,
ADD COLUMN "subtitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN "slug" TEXT,
ADD COLUMN "track" "Track",
ADD COLUMN "priceCents" INTEGER,
ADD COLUMN "estimatedMinutes" INTEGER,
ADD COLUMN "sortOrder" INTEGER;

-- Backfill: the id is already unique, so it is a safe placeholder slug.
UPDATE "courses" SET
  "slug" = COALESCE("slug", "id"),
  "track" = COALESCE("track", 'PUBLIC'),
  "priceCents" = COALESCE("priceCents", 0),
  "estimatedMinutes" = COALESCE("estimatedMinutes", 0),
  "sortOrder" = COALESCE("sortOrder", 0);

ALTER TABLE "courses" ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "track" SET NOT NULL,
ALTER COLUMN "priceCents" SET NOT NULL,
ALTER COLUMN "estimatedMinutes" SET NOT NULL,
ALTER COLUMN "sortOrder" SET NOT NULL;

-- AlterTable: enrollments
ALTER TABLE "enrollments" ADD COLUMN "certificateIssuedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "purchaseId" TEXT,
ADD COLUMN "source" "EnrollmentSource";

-- Existing enrollments were all granted by an admin, which is COMP.
UPDATE "enrollments" SET "source" = COALESCE("source", 'COMP');

ALTER TABLE "enrollments" ALTER COLUMN "source" SET NOT NULL;

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "type" "LessonType" NOT NULL,
    "videoUid" TEXT,
    "body" TEXT,
    "transcript" TEXT,
    "durationSeconds" INTEGER NOT NULL,
    "isFreePreview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_resources" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PurchaseStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastPositionSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "modules_courseId_sortOrder_idx" ON "modules"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "lessons_moduleId_sortOrder_idx" ON "lessons"("moduleId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_moduleId_slug_key" ON "lessons"("moduleId", "slug");

-- CreateIndex
CREATE INDEX "lesson_resources_lessonId_idx" ON "lesson_resources"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_stripeCheckoutSessionId_key" ON "purchases"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "purchases_userId_idx" ON "purchases"("userId");

-- CreateIndex
CREATE INDEX "purchases_courseId_idx" ON "purchases"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
