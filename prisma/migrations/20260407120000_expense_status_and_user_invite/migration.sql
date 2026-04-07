-- Rename expense log status enum values
ALTER TYPE "ExpenseLogStatus" RENAME VALUE 'NOT_STARTED' TO 'PENDING_APPROVAL';
ALTER TYPE "ExpenseLogStatus" RENAME VALUE 'IN_PROGRESS' TO 'APPROVED';
ALTER TYPE "ExpenseLogStatus" RENAME VALUE 'DONE' TO 'PAID';

-- User invite tokens (password set via /accept-invite)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "inviteToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "inviteTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "User_inviteToken_key" ON "User"("inviteToken");
