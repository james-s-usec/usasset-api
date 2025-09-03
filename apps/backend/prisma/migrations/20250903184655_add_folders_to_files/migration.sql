-- AlterTable
ALTER TABLE "public"."files" ADD COLUMN     "folder_id" TEXT;

-- CreateTable
CREATE TABLE "public"."folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "folders_name_key" ON "public"."folders"("name");

-- CreateIndex
CREATE INDEX "folders_name_idx" ON "public"."folders"("name");

-- CreateIndex
CREATE INDEX "folders_is_deleted_idx" ON "public"."folders"("is_deleted");

-- CreateIndex
CREATE INDEX "files_folder_id_idx" ON "public"."files"("folder_id");

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
