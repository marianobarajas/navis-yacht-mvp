-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- Default tenant for existing rows (demo / first customer)
INSERT INTO "Organization" ("id", "name", "slug", "createdAt")
VALUES ('org_demo_default', 'Demo fleet', 'demo', CURRENT_TIMESTAMP);

-- User
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_demo_default';
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
ALTER TABLE "User" ALTER COLUMN "organizationId" DROP DEFAULT;

-- Yacht
ALTER TABLE "Yacht" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_demo_default';
ALTER TABLE "Yacht" ADD CONSTRAINT "Yacht_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Yacht_organizationId_idx" ON "Yacht"("organizationId");
ALTER TABLE "Yacht" ALTER COLUMN "organizationId" DROP DEFAULT;

-- DocumentFolder: replace unique constraint
DROP INDEX IF EXISTS "DocumentFolder_name_yachtId_key";
ALTER TABLE "DocumentFolder" ADD COLUMN "organizationId" TEXT NOT NULL DEFAULT 'org_demo_default';
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "DocumentFolder_organizationId_name_yachtId_key" ON "DocumentFolder"("organizationId", "name", "yachtId");
CREATE INDEX "DocumentFolder_organizationId_idx" ON "DocumentFolder"("organizationId");
ALTER TABLE "DocumentFolder" ALTER COLUMN "organizationId" DROP DEFAULT;
