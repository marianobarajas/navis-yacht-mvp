-- Ensure admin@oceanops.com is Captain with full permissions.
-- Full permissions are role-derived for CAPTAIN; reset overrides to avoid restrictions.
UPDATE "User"
SET
  "role" = 'CAPTAIN'::"Role",
  "permissionOverrides" = NULL
WHERE "email" = 'admin@oceanops.com';
