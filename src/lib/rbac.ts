export type AppRole = "ADMIN" | "MANAGER" | "TECHNICIAN";

export function isAdmin(role?: string) {
  return role === "ADMIN";
}

export function isManager(role?: string) {
  return role === "MANAGER";
}

export function isTechnician(role?: string) {
  return role === "TECHNICIAN";
}

export function isManagerOrAbove(role?: string) {
  return role === "ADMIN" || role === "MANAGER";
}

// Users
export function canCreateUser(role?: string) {
  return isManagerOrAbove(role);
}

// Yachts
export function canCreateYacht(role?: string) {
  return isManagerOrAbove(role);
}

export function canAssignYacht(role?: string) {
  return isManagerOrAbove(role);
}

export function canManageYachts(role?: string) {
  return isManagerOrAbove(role);
}

// Work Orders / Tasks
export function canCreateWorkOrder(role?: string) {
  return isManagerOrAbove(role);
}

export function canAssignWorkOrder(role?: string) {
  return isManagerOrAbove(role);
}

// Logs
export function canCreateLog(role?: string) {
  // everyone can create logs, but server actions should still enforce scope (assigned yachts for TECH)
  return isManagerOrAbove(role) || isTechnician(role);
}

// Calendar
export function canCreateCalendarEvent(role?: string) {
  return isManagerOrAbove(role);
}