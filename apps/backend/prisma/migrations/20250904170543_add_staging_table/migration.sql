-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."JobStatus" ADD VALUE 'STAGED';
ALTER TYPE "public"."JobStatus" ADD VALUE 'APPROVED';

-- CreateTable
CREATE TABLE "public"."staging_assets" (
    "id" TEXT NOT NULL,
    "import_job_id" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "mapped_data" JSONB NOT NULL,
    "validation_errors" JSONB,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "will_import" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staging_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staging_assets_import_job_id_idx" ON "public"."staging_assets"("import_job_id");

-- CreateIndex
CREATE INDEX "staging_assets_is_valid_idx" ON "public"."staging_assets"("is_valid");

-- CreateIndex
CREATE INDEX "staging_assets_will_import_idx" ON "public"."staging_assets"("will_import");

-- AddForeignKey
ALTER TABLE "public"."staging_assets" ADD CONSTRAINT "staging_assets_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
