-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('DOCUMENT', 'IMAGE', 'PDF', 'SPREADSHEET', 'OTHER');

-- AlterTable folders: Add project_id and update constraints
ALTER TABLE "folders" DROP CONSTRAINT IF EXISTS "folders_name_key";
ALTER TABLE "folders" ADD COLUMN "project_id" TEXT NOT NULL DEFAULT 'temp';
CREATE UNIQUE INDEX "folders_name_project_id_key" ON "folders"("name", "project_id");
CREATE INDEX "folders_project_id_idx" ON "folders"("project_id");
ALTER TABLE "folders" ADD CONSTRAINT "folders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable files: Add file_type and asset_id
ALTER TABLE "files" ADD COLUMN "file_type" "FileType" NOT NULL DEFAULT 'DOCUMENT';
ALTER TABLE "files" ADD COLUMN "asset_id" TEXT;
CREATE INDEX "files_asset_id_idx" ON "files"("asset_id");
ALTER TABLE "files" ADD CONSTRAINT "files_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable phase_results
CREATE TABLE "phase_results" (
    "id" TEXT NOT NULL,
    "import_job_id" TEXT NOT NULL,
    "phase" "PipelinePhase" NOT NULL,
    "status" TEXT NOT NULL,
    "transformations" JSONB NOT NULL,
    "applied_rules" TEXT[],
    "input_sample" JSONB,
    "output_sample" JSONB,
    "rows_processed" INTEGER NOT NULL DEFAULT 0,
    "rows_modified" INTEGER NOT NULL DEFAULT 0,
    "rows_failed" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "errors" JSONB,
    "warnings" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,

    CONSTRAINT "phase_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phase_results_import_job_id_phase_idx" ON "phase_results"("import_job_id", "phase");
CREATE INDEX "phase_results_phase_idx" ON "phase_results"("phase");
CREATE INDEX "phase_results_started_at_idx" ON "phase_results"("started_at");

-- AddForeignKey
ALTER TABLE "phase_results" ADD CONSTRAINT "phase_results_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;