/** Number of decorative water patterns for yachts without a cover image. */
export const COVER_PATTERN_COUNT = 5;

export type CoverPatternIndex = 0 | 1 | 2 | 3 | 4;

/**
 * Stable pseudo-random pattern index per yacht (from id).
 * Same yacht always maps to the same pattern across loads and devices.
 */
export function coverPatternIndexFromYachtId(yachtId: string): CoverPatternIndex {
  let h = 2166136261;
  for (let i = 0; i < yachtId.length; i++) {
    h ^= yachtId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h | 0) % COVER_PATTERN_COUNT) as CoverPatternIndex;
}
