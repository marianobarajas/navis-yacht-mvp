-- CreateTable
CREATE TABLE "WorkOrderCommentAttachment" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "uploaderUserId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderCommentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderCommentAttachment_storageKey_key" ON "WorkOrderCommentAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "WorkOrderCommentAttachment_commentId_idx" ON "WorkOrderCommentAttachment"("commentId");

-- CreateIndex
CREATE INDEX "WorkOrderCommentAttachment_uploaderUserId_idx" ON "WorkOrderCommentAttachment"("uploaderUserId");

-- CreateIndex
CREATE INDEX "WorkOrderCommentAttachment_createdAt_idx" ON "WorkOrderCommentAttachment"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkOrderCommentAttachment" ADD CONSTRAINT "WorkOrderCommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "WorkOrderComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderCommentAttachment" ADD CONSTRAINT "WorkOrderCommentAttachment_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
