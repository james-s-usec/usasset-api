-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED', 'DISPOSED');

-- AlterTable
ALTER TABLE "public"."assets" ADD COLUMN     "location" TEXT,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "modelNumber" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "status" "public"."AssetStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "public"."assets"("status");

-- CreateIndex
CREATE INDEX "assets_projectId_idx" ON "public"."assets"("projectId");

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
