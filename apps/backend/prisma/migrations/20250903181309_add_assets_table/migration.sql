-- CreateTable
CREATE TABLE "public"."assets" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetTag_key" ON "public"."assets"("assetTag");

-- CreateIndex
CREATE INDEX "assets_assetTag_idx" ON "public"."assets"("assetTag");

-- CreateIndex
CREATE INDEX "assets_created_at_idx" ON "public"."assets"("created_at");

-- CreateIndex
CREATE INDEX "assets_is_deleted_idx" ON "public"."assets"("is_deleted");
