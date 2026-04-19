-- Merge legacy Role (ADMIN/MANAGER/TECHNICIAN) + CrewPosition into a single Role enum (yacht positions).

CREATE TYPE "Role_new" AS ENUM (
  'CAPTAIN',
  'CHIEF_ENGINEER',
  'FIRST_MATE',
  'BOSUN',
  'DECKHAND_1_2',
  'CHEF',
  'CHIEF_STEWARDESS',
  'STEWARDESS_1_2'
);

ALTER TABLE "User" ADD COLUMN "role_merged" "Role_new";

UPDATE "User" SET "role_merged" = "crewPosition"::text::"Role_new";

UPDATE "User" SET "role_merged" = 'CAPTAIN'::"Role_new" WHERE "isPlatformAdmin" = true;

ALTER TABLE "User" ALTER COLUMN "role_merged" SET NOT NULL;

ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" DROP COLUMN "crewPosition";

DROP TYPE "Role";
DROP TYPE "CrewPosition";

ALTER TABLE "User" RENAME COLUMN "role_merged" TO "role";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'DECKHAND_1_2'::"Role_new";

ALTER TYPE "Role_new" RENAME TO "Role";
