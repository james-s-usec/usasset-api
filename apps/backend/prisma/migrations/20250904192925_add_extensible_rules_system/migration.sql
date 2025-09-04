-- CreateEnum
CREATE TYPE "public"."PipelinePhase" AS ENUM ('EXTRACT', 'VALIDATE', 'CLEAN', 'TRANSFORM', 'MAP', 'LOAD');

-- CreateEnum
CREATE TYPE "public"."RuleType" AS ENUM ('ENCODING_DETECTOR', 'COLUMN_MAPPER', 'DELIMITER_DETECTOR', 'HEADER_VALIDATOR', 'REQUIRED_FIELD', 'DATA_TYPE_CHECK', 'RANGE_VALIDATOR', 'FORMAT_VALIDATOR', 'TRIM', 'REGEX_REPLACE', 'EXACT_REPLACE', 'REMOVE_DUPLICATES', 'TO_UPPERCASE', 'TO_LOWERCASE', 'TITLE_CASE', 'DATE_FORMAT', 'NUMERIC_FORMAT', 'CALCULATE_FIELD', 'FIELD_MAPPING', 'ENUM_MAPPING', 'REFERENCE_LOOKUP', 'DEFAULT_VALUE', 'CONFLICT_RESOLUTION', 'BATCH_SIZE', 'TRANSACTION_BOUNDARY', 'ROLLBACK_STRATEGY');

-- CreateTable
CREATE TABLE "public"."pipeline_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "public"."PipelinePhase" NOT NULL,
    "type" "public"."RuleType" NOT NULL,
    "target" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "pipeline_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipeline_rules_phase_is_active_priority_idx" ON "public"."pipeline_rules"("phase", "is_active", "priority");

-- CreateIndex
CREATE INDEX "pipeline_rules_type_target_idx" ON "public"."pipeline_rules"("type", "target");

-- CreateIndex
CREATE INDEX "pipeline_rules_is_active_idx" ON "public"."pipeline_rules"("is_active");
