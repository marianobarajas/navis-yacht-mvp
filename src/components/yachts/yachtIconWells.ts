import { normalizeYachtIconVariant } from "@/lib/yachtIconVariant";

/** Frosted chips on dashboard hero — high contrast behind `YachtSilhouetteIcon` */
const GLASS_WELLS = [
  "border-cyan-200/55 bg-cyan-500/35 shadow-md shadow-black/35 ring-2 ring-white/30 backdrop-blur-sm",
  "border-sky-200/55 bg-sky-600/40 shadow-md shadow-black/35 ring-2 ring-white/30 backdrop-blur-sm",
  "border-teal-200/55 bg-teal-600/38 shadow-md shadow-black/35 ring-2 ring-white/30 backdrop-blur-sm",
  "border-indigo-200/50 bg-indigo-600/40 shadow-md shadow-black/35 ring-2 ring-white/30 backdrop-blur-sm",
  "border-amber-200/55 bg-amber-500/35 shadow-md shadow-black/35 ring-2 ring-white/30 backdrop-blur-sm",
  "border-emerald-200/55 bg-emerald-600/38 shadow-md shadow-black/35 ring-2 ring-white/30 backdrop-blur-sm",
] as const;

const PAGE_WELLS = [
  "border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100/90 shadow-sm ring-1 ring-cyan-900/10",
  "border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100/90 shadow-sm ring-1 ring-sky-900/10",
  "border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100/90 shadow-sm ring-1 ring-teal-900/10",
  "border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/90 shadow-sm ring-1 ring-indigo-900/10",
  "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/90 shadow-sm ring-1 ring-amber-900/10",
  "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/90 shadow-sm ring-1 ring-emerald-900/10",
] as const;

const GLASS_ICON = "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]";
const PAGE_ICON = "text-slate-900 drop-shadow-sm";

export function yachtIconWellClass(glass: boolean | undefined, iconVariant: unknown): string {
  const i = normalizeYachtIconVariant(iconVariant);
  const base =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--apple-radius)]";
  if (glass) {
    return `${base} ${GLASS_WELLS[i]}`;
  }
  return `${base} ${PAGE_WELLS[i]}`;
}

export function yachtIconGlyphClass(glass: boolean | undefined): string {
  return glass ? GLASS_ICON : PAGE_ICON;
}
