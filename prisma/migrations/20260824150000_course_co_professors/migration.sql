-- CreateTable: additional professors listed on a course, alongside the primary owner
CREATE TABLE "course_professors" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_professors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_professors_courseId_professorId_key" ON "course_professors"("courseId", "professorId");

-- AddForeignKey
ALTER TABLE "course_professors" ADD CONSTRAINT "course_professors_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_professors" ADD CONSTRAINT "course_professors_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
