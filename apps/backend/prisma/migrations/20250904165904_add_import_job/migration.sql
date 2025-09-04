-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."import_jobs" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "total_rows" INTEGER,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "public"."import_jobs"("status");

-- CreateIndex
CREATE INDEX "import_jobs_started_at_idx" ON "public"."import_jobs"("started_at");

-- CreateIndex
CREATE INDEX "import_jobs_file_id_idx" ON "public"."import_jobs"("file_id");

-- AddForeignKey
ALTER TABLE "public"."import_jobs" ADD CONSTRAINT "import_jobs_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
