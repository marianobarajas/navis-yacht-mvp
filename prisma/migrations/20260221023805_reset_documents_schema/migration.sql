/*
  Warnings:

  - You are about to drop the column `mimeType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `sizeBytes` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `storageKey` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedByUserId` on the `Document` table. All the data in the column will be lost.
  - Added the required column `createdByUserId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Made the column `externalUrl` on table `Document` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_uploadedByUserId_fkey";

-- DropIndex
DROP INDEX "Document_storageKey_key";

-- DropIndex
DROP INDEX "Document_uploadedByUserId_idx";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "mimeType",
DROP COLUMN "originalName",
DROP COLUMN "sizeBytes",
DROP COLUMN "storageKey",
DROP COLUMN "uploadedByUserId",
ADD COLUMN     "createdByUserId" TEXT NOT NULL,
ALTER COLUMN "externalUrl" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Document_createdByUserId_idx" ON "Document"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
