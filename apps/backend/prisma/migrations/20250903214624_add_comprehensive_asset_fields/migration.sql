-- AlterTable
ALTER TABLE "public"."assets" ADD COLUMN     "amperage" DECIMAL(10,2),
ADD COLUMN     "annualMaintenanceCost" DECIMAL(12,2),
ADD COLUMN     "area" TEXT,
ADD COLUMN     "assetCategory" TEXT,
ADD COLUMN     "assetType" TEXT,
ADD COLUMN     "btuRating" INTEGER,
ADD COLUMN     "buildingName" TEXT,
ADD COLUMN     "catalogItemId" TEXT,
ADD COLUMN     "catalogName" TEXT,
ADD COLUMN     "currentBookValue" DECIMAL(12,2),
ADD COLUMN     "dailyOperatingHours" DECIMAL(4,2),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "equipmentSize" TEXT,
ADD COLUMN     "estimatedAnnualKwh" DECIMAL(12,2),
ADD COLUMN     "estimatedAnnualOperatingCost" DECIMAL(12,2),
ADD COLUMN     "expectedLifetime" INTEGER,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "installDate" TIMESTAMP(3),
ADD COLUMN     "installationCost" DECIMAL(12,2),
ADD COLUMN     "manufactureDate" TIMESTAMP(3),
ADD COLUMN     "motorHp" DECIMAL(10,2),
ADD COLUMN     "operationsSystem" TEXT,
ADD COLUMN     "phase" INTEGER,
ADD COLUMN     "purchaseCost" DECIMAL(12,2),
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "ratedPowerKw" DECIMAL(10,3),
ADD COLUMN     "roomNumber" TEXT,
ADD COLUMN     "serviceLife" INTEGER,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "squareFeet" DECIMAL(10,2),
ADD COLUMN     "systemCategory" TEXT,
ADD COLUMN     "totalCostOfOwnership" DECIMAL(12,2),
ADD COLUMN     "trade" TEXT,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "voltage" INTEGER,
ADD COLUMN     "weight" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "assets_assetCategory_idx" ON "public"."assets"("assetCategory");

-- CreateIndex
CREATE INDEX "assets_assetType_idx" ON "public"."assets"("assetType");

-- CreateIndex
CREATE INDEX "assets_installDate_idx" ON "public"."assets"("installDate");
