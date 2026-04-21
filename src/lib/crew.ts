import type { Role, ShiftStatus } from "@prisma/client";

export const ROLE_ORDER: Role[] = [
  "CAPTAIN",
  "CHIEF_ENGINEER",
  "FIRST_MATE",
  "BOSUN",
  "DECKHAND_1",
  "DECKHAND_2",
  "CHEF",
  "CHIEF_STEWARDESS",
  "STEWARDESS_1",
  "STEWARDESS_2",
];

export const ROLE_LABELS: Record<Role, string> = {
  CAPTAIN: "Captain",
  CHIEF_ENGINEER: "Chief Engineer",
  FIRST_MATE: "First Mate",
  BOSUN: "Bosun",
  DECKHAND_1: "1 Deckhand",
  DECKHAND_2: "2 Deckhands",
  CHEF: "Chef",
  CHIEF_STEWARDESS: "Chief Stewardess",
  STEWARDESS_1: "1 Stewardness",
  STEWARDESS_2: "2 Stewardness",
};

export const SHIFT_STATUS_ORDER: ShiftStatus[] = [
  "ACTIVE",
  "ON_DUTY",
  "OFF_DUTY",
  "ON_LEAVE",
  "ON_ROTATION",
  "STANDBY",
];

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  ACTIVE: "Active",
  ON_DUTY: "On duty",
  OFF_DUTY: "Off duty",
  ON_LEAVE: "On leave",
  ON_ROTATION: "On rotation",
  STANDBY: "Standby",
};

export const ROLE_SELECT_OPTIONS = ROLE_ORDER.map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

export const SHIFT_STATUS_SELECT_OPTIONS = SHIFT_STATUS_ORDER.map((value) => ({
  value,
  label: SHIFT_STATUS_LABELS[value],
}));

export function roleSortIndex(role: Role): number {
  const i = ROLE_ORDER.indexOf(role);
  return i >= 0 ? i : ROLE_ORDER.length;
}

/** “Present / working” states — used for avatar status dot */
export function shiftStatusShowsActiveDot(status: ShiftStatus): boolean {
  return status === "ON_DUTY" || status === "ACTIVE";
}
