import type { Role } from "@prisma/client";

/** Full org control (invite Captain, edit Captains, last-Captain checks). */
export function isCaptain(role?: string) {
  return role === "CAPTAIN";
}

/** Bridge / department heads — manage crew & yachts, cannot assign or edit Captains. */
const MANAGER_TIER: Role[] = ["CHIEF_ENGINEER", "FIRST_MATE", "BOSUN"];

export function isManagerTier(role?: string): role is Role {
  return role !== undefined && MANAGER_TIER.includes(role as Role);
}

/** Deck & interior crew — task-focused access (assigned yachts, logs). */
const CREW_TIER: Role[] = ["DECKHAND_1_2", "CHEF", "CHIEF_STEWARDESS", "STEWARDESS_1_2"];

export function isCrewTier(role?: string): role is Role {
  return role !== undefined && CREW_TIER.includes(role as Role);
}

/** Captain or bridge — admin UI, manage users/yachts (with Captain-only rules for Captains). */
export function isManagerOrAbove(role?: string) {
  return isCaptain(role) || isManagerTier(role);
}

export function canCreateUser(role?: string) {
  return isManagerOrAbove(role);
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

export function canCreateYacht(role?: string) {
  return isManagerOrAbove(role);
}

export function canAssignYacht(role?: string) {
  return isManagerOrAbove(role);
}

export function canManageYachts(role?: string) {
  return isManagerOrAbove(role);
}

export function canCreateWorkOrder(role?: string) {
  return isManagerOrAbove(role);
}

export function canAssignWorkOrder(role?: string) {
  return isManagerOrAbove(role);
}

export function canCreateLog(role?: string) {
  return isManagerOrAbove(role) || isCrewTier(role);
}

export function canCreateCalendarEvent(role?: string) {
  return isManagerOrAbove(role);
}
