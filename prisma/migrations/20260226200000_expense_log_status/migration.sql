-- CreateEnum
CREATE TYPE "ExpenseLogStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "ExpenseLog" ADD COLUMN "status" "ExpenseLogStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- Migrate isDone to status
UPDATE "ExpenseLog" SET "status" = 'DONE' WHERE "isDone" = true;
UPDATE "ExpenseLog" SET "status" = 'NOT_STARTED' WHERE "isDone" = false;

-- AlterTable
ALTER TABLE "ExpenseLog" DROP COLUMN "isDone";
