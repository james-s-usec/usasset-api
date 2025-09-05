-- CreateTable
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

-- CreateIndex
CREATE INDEX "phase_results_phase_idx" ON "phase_results"("phase");

-- CreateIndex
CREATE INDEX "phase_results_started_at_idx" ON "phase_results"("started_at");

-- AddForeignKey
ALTER TABLE "phase_results" ADD CONSTRAINT "phase_results_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;