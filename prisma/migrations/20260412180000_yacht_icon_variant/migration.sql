-- Random silhouette variant per yacht (0–5); existing rows get a stable pseudo-random from id length + char sum
ALTER TABLE "Yacht" ADD COLUMN "iconVariant" INTEGER NOT NULL DEFAULT 0;

UPDATE "Yacht"
SET "iconVariant" = abs(hashtext(id)) % 6;
