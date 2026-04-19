-- CreateEnum
CREATE TYPE "CrewPosition" AS ENUM ('CAPTAIN', 'CHIEF_ENGINEER', 'FIRST_MATE', 'BOSUN', 'DECKHAND_1_2', 'CHEF', 'CHIEF_STEWARDESS', 'STEWARDESS_1_2');

-- Replace ShiftStatus enum values (PostgreSQL)
CREATE TYPE "ShiftStatus_new" AS ENUM ('ACTIVE', 'ON_DUTY', 'OFF_DUTY', 'ON_LEAVE', 'ON_ROTATION', 'STANDBY');

ALTER TABLE "User" ALTER COLUMN "shiftStatus" DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "shiftStatus" TYPE "ShiftStatus_new" USING (
  CASE "shiftStatus"::text
    WHEN 'ON_SHIFT' THEN 'ON_DUTY'::"ShiftStatus_new"
    WHEN 'OFF_DUTY' THEN 'OFF_DUTY'::"ShiftStatus_new"
    WHEN 'UNAVAILABLE' THEN 'ON_LEAVE'::"ShiftStatus_new"
    ELSE 'OFF_DUTY'::"ShiftStatus_new"
  END
);

ALTER TABLE "User" ALTER COLUMN "shiftStatus" SET DEFAULT 'OFF_DUTY'::"ShiftStatus_new";

DROP TYPE "ShiftStatus";

ALTER TYPE "ShiftStatus_new" RENAME TO "ShiftStatus";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "crewPosition" "CrewPosition" NOT NULL DEFAULT 'DECKHAND_1_2';
