-- AlterTable
ALTER TABLE "public"."files" ADD COLUMN     "project_id" TEXT;

-- CreateIndex
CREATE INDEX "files_project_id_idx" ON "public"."files"("project_id");

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
