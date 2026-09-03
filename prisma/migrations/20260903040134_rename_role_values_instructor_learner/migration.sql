-- Rename the Role enum values for the Olive Institute vocabulary.
--
-- `ALTER TYPE ... RENAME VALUE` rewrites the label in place, so existing
-- rows keep their role. Prisma's generated diff would instead create a new
-- enum type and cast across it, which fails for any row still holding the
-- old label — hence the hand-written migration.
ALTER TYPE "Role" RENAME VALUE 'PROFESSOR' TO 'INSTRUCTOR';
ALTER TYPE "Role" RENAME VALUE 'STUDENT' TO 'LEARNER';
