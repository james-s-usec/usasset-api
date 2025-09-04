-- CreateEnum
CREATE TYPE "public"."AssetCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'FOR_REPAIR', 'FOR_DISPOSAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AssetStatus" ADD VALUE 'INACTIVE';
ALTER TYPE "public"."AssetStatus" ADD VALUE 'LOST';
ALTER TYPE "public"."AssetStatus" ADD VALUE 'STOLEN';

-- AlterTable
ALTER TABLE "public"."assets" ADD COLUMN     "condition" "public"."AssetCondition" NOT NULL DEFAULT 'GOOD';
