-- AlterTable
ALTER TABLE "achievements" ADD COLUMN     "course_id" TEXT;

-- CreateIndex
CREATE INDEX "achievements_course_id_idx" ON "achievements"("course_id");

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
