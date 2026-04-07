-- DropIndex
DROP INDEX "WorkOrder_assignedToUserId_idx";

-- DropIndex
DROP INDEX "WorkOrder_dueDate_idx";

-- DropIndex
DROP INDEX "WorkOrder_priority_idx";

-- DropIndex
DROP INDEX "WorkOrder_status_idx";

-- DropIndex
DROP INDEX "WorkOrder_yachtId_idx";

-- CreateTable
CREATE TABLE "WorkOrderAttachment" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "uploaderUserId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderAttachment_workOrderId_idx" ON "WorkOrderAttachment"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderAttachment_uploaderUserId_idx" ON "WorkOrderAttachment"("uploaderUserId");

-- CreateIndex
CREATE INDEX "WorkOrderAttachment_createdAt_idx" ON "WorkOrderAttachment"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkOrderAttachment" ADD CONSTRAINT "WorkOrderAttachment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderAttachment" ADD CONSTRAINT "WorkOrderAttachment_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
