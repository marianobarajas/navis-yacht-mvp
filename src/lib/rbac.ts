import type { Role } from "@prisma/client";

export type PermissionKey =
  | "all_permissions"
  | "manage_users_yachts"
  | "create_assign_tasks"
  | "full_system_access"
  | "manage_yachts_crew"
  | "view_all_logs_documents"
  | "manage_team_members"
  | "view_assigned_yachts"
  | "create_logs"
  | "update_task_status"
  | "view_documents_assigned_yachts"
  | "create_task_button"
  | "create_crew_button"
  | "create_yacht_button"
  | "create_calendar_event_button"
  | "create_folder_button";

type PermissionOverrides = Record<string, boolean> | null | undefined;

/** Full org control (invite Captain, edit Captains, last-Captain checks). */
/** `ADMIN` is accepted for JWTs issued before Role enum migration (same access as Captain). */
export function isCaptain(role?: string) {
  return role === "CAPTAIN" || role === "ADMIN";
}

/** Bridge / department heads — manage crew & yachts, cannot assign or edit Captains. */
const MANAGER_TIER: Role[] = ["CHIEF_ENGINEER", "FIRST_MATE", "BOSUN"];

export function isManagerTier(role?: string): role is Role {
  return role !== undefined && MANAGER_TIER.includes(role as Role);
}

/** Deck & interior crew — task-focused access (assigned yachts, logs). */
const CREW_TIER: Role[] = ["DECKHAND_1", "DECKHAND_2", "CHEF", "CHIEF_STEWARDESS", "STEWARDESS_1", "STEWARDESS_2"];

export function isCrewTier(role?: string): role is Role {
  return role !== undefined && CREW_TIER.includes(role as Role);
}

/** Captain or bridge — admin UI, manage users/yachts (with Captain-only rules for Captains). */
export function isManagerOrAbove(role?: string) {
  return isCaptain(role) || isManagerTier(role);
}

const PERM_CAPTAIN: PermissionKey[] = [
  "all_permissions",
  "manage_users_yachts",
  "create_assign_tasks",
  "full_system_access",
  "manage_yachts_crew",
  "view_all_logs_documents",
  "manage_team_members",
  "view_assigned_yachts",
  "create_logs",
  "update_task_status",
  "view_documents_assigned_yachts",
  "create_task_button",
  "create_crew_button",
  "create_yacht_button",
  "create_calendar_event_button",
  "create_folder_button",
];

const PERM_MANAGER: PermissionKey[] = [
  "manage_users_yachts",
  "create_assign_tasks",
  "manage_yachts_crew",
  "view_all_logs_documents",
  "manage_team_members",
  "view_assigned_yachts",
  "create_logs",
  "update_task_status",
  "view_documents_assigned_yachts",
  "create_task_button",
  "create_crew_button",
  "create_yacht_button",
  "create_calendar_event_button",
  "create_folder_button",
];

const PERM_CREW: PermissionKey[] = [
  "view_assigned_yachts",
  "create_logs",
  "update_task_status",
  "view_documents_assigned_yachts",
];

export function roleDefaultPermissions(role: Role): Record<PermissionKey, boolean> {
  const ids = isCaptain(role) ? PERM_CAPTAIN : isManagerTier(role) ? PERM_MANAGER : PERM_CREW;
  return Object.fromEntries(([
    ...new Set([...PERM_CAPTAIN, ...PERM_MANAGER, ...PERM_CREW]),
  ] as PermissionKey[]).map((id) => [id, ids.includes(id)])) as Record<PermissionKey, boolean>;
}

export function isPermissionEnabled(role: Role, overrides: PermissionOverrides, key: PermissionKey): boolean {
  const defaults = roleDefaultPermissions(role);
  if (defaults.all_permissions) return true;
  if (overrides && overrides[key] !== undefined) return Boolean(overrides[key]);
  return defaults[key];
}

export function canCreateUser(role?: string, overrides?: PermissionOverrides) {
  return (
    isManagerOrAbove(role) &&
    !!role &&
    isPermissionEnabled(role as Role, overrides, "create_crew_button")
  );
}

export function canAssignCaptain(actor?: string) {
  return isCaptain(actor);
}

/** Non-captains may assign any role except Captain. */
export function canAssignRole(actorRole: Role, targetRole: Role): boolean {
  if (isCaptain(actorRole)) return true;
  if (!isManagerOrAbove(actorRole)) return false;
  return targetRole !== "CAPTAIN";
}

export function canEditUserRole(actorRole: Role, targetRole: Role): boolean {
  if (!isManagerOrAbove(actorRole)) return false;
  if (targetRole === "CAPTAIN" && !isCaptain(actorRole)) return false;
  return true;
}

export function canCreateYacht(role?: string, overrides?: PermissionOverrides) {
  return (
    isManagerOrAbove(role) &&
    !!role &&
    isPermissionEnabled(role as Role, overrides, "create_yacht_button")
  );
}

export function canAssignYacht(role?: string) {
  return isManagerOrAbove(role);
}

export function canManageYachts(role?: string) {
  return isManagerOrAbove(role);
}

export function canCreateWorkOrder(role?: string, overrides?: PermissionOverrides) {
  return (
    isManagerOrAbove(role) &&
    !!role &&
    isPermissionEnabled(role as Role, overrides, "create_task_button")
  );
}

export function canAssignWorkOrder(role?: string) {
  return isManagerOrAbove(role);
}

export function canCreateLog(role?: string) {
  return isManagerOrAbove(role) || isCrewTier(role);
}

export function canCreateCalendarEvent(role?: string, overrides?: PermissionOverrides) {
  return (
    isManagerOrAbove(role) &&
    !!role &&
    isPermissionEnabled(role as Role, overrides, "create_calendar_event_button")
  );
}

export function canCreateFolder(role?: string, overrides?: PermissionOverrides) {
  return (
    isManagerOrAbove(role) &&
    !!role &&
    isPermissionEnabled(role as Role, overrides, "create_folder_button")
  );
}
