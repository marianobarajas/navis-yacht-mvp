/**
 * Shared priority / role accent classes for borders, dots, and list strips
 * (matches dashboard reference: teal / coral / gold / salmon cues).
 */

export function priorityBorderLeftClass(priority: string): string {
  switch (priority) {
    case "CRITICAL":
      return "border-l-[var(--accent-urgent)]";
    case "HIGH":
      return "border-l-[#c9a43a]";
    case "MEDIUM":
      return "border-l-[var(--palette-muted-teal)]";
    case "LOW":
      return "border-l-[var(--accent-warning)]";
    default:
      return "border-l-[var(--apple-border-strong)]";
  }
}

export function priorityDotClass(priority: string): string {
  switch (priority) {
    case "CRITICAL":
      return "bg-[var(--accent-urgent)]";
    case "HIGH":
      return "bg-[#c9a43a]";
    case "MEDIUM":
      return "bg-[var(--palette-muted-teal)]";
    case "LOW":
      return "bg-[var(--accent-warning)]";
    default:
      return "bg-[var(--palette-slate)]";
  }
}

/** Left accent on crew cards by role (yacht position). */
export function roleBorderLeftClass(role: string): string {
  switch (role) {
    case "CAPTAIN":
      return "border-l-amber-400";
    case "CHIEF_ENGINEER":
      return "border-l-sky-400";
    case "FIRST_MATE":
      return "border-l-teal-400";
    case "BOSUN":
      return "border-l-cyan-400";
    case "DECKHAND_1":
      return "border-l-emerald-400";
    case "DECKHAND_2":
      return "border-l-emerald-300";
    case "CHEF":
      return "border-l-orange-400";
    case "CHIEF_STEWARDESS":
      return "border-l-violet-400";
    case "STEWARDESS_1":
      return "border-l-fuchsia-400";
    case "STEWARDESS_2":
      return "border-l-fuchsia-300";
    default:
      return "border-l-[var(--apple-border-strong)]";
  }
}

/** For grids/lists: rotate accent families so neighbors differ */
const ACCENT_STRIP_ROTATE = [
  "border-l-[var(--palette-muted-teal)]",
  "border-l-[var(--apple-accent)]",
  "border-l-[var(--accent-urgent)]",
  "border-l-[var(--accent-warning)]",
] as const;

export function accentStripByIndex(i: number): string {
  return ACCENT_STRIP_ROTATE[i % ACCENT_STRIP_ROTATE.length]!;
}

const ICON_TILE_ROTATE = [
  { box: "bg-[var(--ocean-teal-muted)]", icon: "text-[var(--palette-teal-dark)]" },
  { box: "bg-[var(--apple-accent-muted)]", icon: "text-[var(--apple-accent)]" },
  { box: "bg-[var(--ocean-coral-muted)]", icon: "text-[var(--accent-urgent)]" },
  { box: "bg-[var(--ocean-success-muted)]", icon: "text-[var(--palette-success-dark)]" },
] as const;

export function iconTileAccentByIndex(i: number): (typeof ICON_TILE_ROTATE)[number] {
  return ICON_TILE_ROTATE[i % ICON_TILE_ROTATE.length]!;
}
