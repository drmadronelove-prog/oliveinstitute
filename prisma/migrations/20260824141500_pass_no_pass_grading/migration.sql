-- CreateEnum
CREATE TYPE "SubmissionGrade" AS ENUM ('PASS', 'NO_PASS');

-- AlterTable: assignments no longer carry a point value (grading is pass/no-pass)
ALTER TABLE "assignments" DROP COLUMN "maxPoints";

-- AlterTable: submissions.grade moves from a numeric score to pass/no-pass
ALTER TABLE "submissions" DROP COLUMN "grade";
ALTER TABLE "submissions" ADD COLUMN "grade" "SubmissionGrade";
