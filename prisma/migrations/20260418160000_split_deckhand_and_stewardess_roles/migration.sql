-- Split combined role buckets into explicit 1/2 roles and
-- ensure demo admin user is Captain with full permissions.

CREATE TYPE "Role_new" AS ENUM (
  'CAPTAIN',
  'CHIEF_ENGINEER',
  'FIRST_MATE',
  'BOSUN',
  'DECKHAND_1',
  'DECKHAND_2',
  'CHEF',
  'CHIEF_STEWARDESS',
  'STEWARDESS_1',
  'STEWARDESS_2'
);

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role_new"
USING (
  CASE "role"::text
    WHEN 'DECKHAND_1_2' THEN 'DECKHAND_1'::"Role_new"
    WHEN 'STEWARDESS_1_2' THEN 'STEWARDESS_1'::"Role_new"
    ELSE "role"::text::"Role_new"
  END
);

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'DECKHAND_1'::"Role";

UPDATE "User"
SET
  "role" = 'CAPTAIN'::"Role",
  "permissionOverrides" = '{
    "all_permissions": true,
    "manage_users_yachts": true,
    "create_assign_tasks": true,
    "full_system_access": true,
    "manage_yachts_crew": true,
    "view_all_logs_documents": true,
    "manage_team_members": true,
    "view_assigned_yachts": true,
    "create_logs": true,
    "update_task_status": true,
    "view_documents_assigned_yachts": true
  }'::jsonb
WHERE "email" = 'admin@oceanops.demo';
