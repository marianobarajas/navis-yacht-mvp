-- Platform owner accounts (software operator): optional org + flag
ALTER TABLE "User" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User" ALTER COLUMN "organizationId" DROP NOT NULL;
