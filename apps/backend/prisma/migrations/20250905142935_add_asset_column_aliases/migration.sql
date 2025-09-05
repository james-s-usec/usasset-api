-- CreateTable
CREATE TABLE "public"."asset_column_aliases" (
    "id" TEXT NOT NULL,
    "asset_field" TEXT NOT NULL,
    "csv_alias" TEXT NOT NULL,
    "confidence" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "asset_column_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_column_aliases_csv_alias_key" ON "public"."asset_column_aliases"("csv_alias");

-- CreateIndex
CREATE INDEX "asset_column_aliases_asset_field_idx" ON "public"."asset_column_aliases"("asset_field");

-- CreateIndex
CREATE INDEX "asset_column_aliases_csv_alias_idx" ON "public"."asset_column_aliases"("csv_alias");
