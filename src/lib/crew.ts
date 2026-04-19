import type { CrewPosition, ShiftStatus } from "@prisma/client";

export const CREW_POSITION_ORDER: CrewPosition[] = [
  "CAPTAIN",
  "CHIEF_ENGINEER",
  "FIRST_MATE",
  "BOSUN",
  "DECKHAND_1_2",
  "CHEF",
  "CHIEF_STEWARDESS",
  "STEWARDESS_1_2",
];

export const CREW_POSITION_LABELS: Record<CrewPosition, string> = {
  CAPTAIN: "Captain",
  CHIEF_ENGINEER: "Chief Engineer",
  FIRST_MATE: "First Mate",
  BOSUN: "Bosun",
  DECKHAND_1_2: "1–2 Deckhands",
  CHEF: "Chef",
  CHIEF_STEWARDESS: "Chief Stewardess",
  STEWARDESS_1_2: "1–2 Stewardess",
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

export const CREW_POSITION_SELECT_OPTIONS = CREW_POSITION_ORDER.map((value) => ({
  value,
  label: CREW_POSITION_LABELS[value],
}));

export const SHIFT_STATUS_SELECT_OPTIONS = SHIFT_STATUS_ORDER.map((value) => ({
  value,
  label: SHIFT_STATUS_LABELS[value],
}));

export function crewPositionSortIndex(position: CrewPosition): number {
  const i = CREW_POSITION_ORDER.indexOf(position);
  return i >= 0 ? i : CREW_POSITION_ORDER.length;
}

/** “Present / working” states — used for avatar status dot */
export function shiftStatusShowsActiveDot(status: ShiftStatus): boolean {
  return status === "ON_DUTY" || status === "ACTIVE";
}
