import Link from "next/link";
import { accentStripByIndex, iconTileAccentByIndex } from "@/lib/uiAccent";

type Yacht = {
  id: string;
  name: string;
  registrationNumber: string;
  marina: string;
  assignments?: { user: { id: string } }[];
};

const GLASS_OUTER =
  "rounded-[var(--apple-radius-lg)] border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ease-out hover:scale-[1.01] hover:border-white/45 hover:bg-white/[0.14] hover:shadow-[0_24px_55px_-12px_rgba(0,0,0,0.52)]";

export function MyYachtsWidget({ yachts, glass }: { yachts: Yacht[]; glass?: boolean }) {
  if (yachts.length === 0) {
    return (
      <div
        className={
          glass
            ? `${GLASS_OUTER} p-8`
            : "rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-8 shadow-[var(--apple-shadow-sm)]"
        }
      >
        <h3 className="text-base font-semibold text-[var(--apple-text-primary)]">
          My Yachts
        </h3>
        <p className="mt-5 text-center text-base text-[var(--apple-text-tertiary)]">
          No yachts assigned to you yet
        </p>
        <Link
          href="/yachts"
          className="mt-3 block text-center text-base font-medium text-[var(--apple-accent)] hover:underline"
        >
          View maintenance →
        </Link>
      </div>
    );
  }

  return (
    <div
      className={
        glass
          ? `${GLASS_OUTER} p-6`
          : "rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-6 shadow-[var(--apple-shadow-sm)]"
      }
    >
      <h3 className="text-base font-semibold text-[var(--apple-text-primary)]">
        My Yachts
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {yachts.map((y, i) => {
          const tile = iconTileAccentByIndex(i);
          return (
            <Link
              key={y.id}
              href={`/yachts/${y.id}`}
              className={
                glass
                  ? `flex items-center gap-3 overflow-hidden rounded-[var(--apple-radius)] border border-white/12 border-l-4 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/12 hover:border-white/25 ${accentStripByIndex(i)}`
                  : `flex items-center gap-3 overflow-hidden rounded-[var(--apple-radius)] border border-[var(--apple-border)] border-l-4 p-4 transition-colors hover:bg-[var(--apple-bg-subtle)] hover:border-[var(--apple-border-strong)] ${accentStripByIndex(i)}`
              }
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--apple-radius)] ${tile.box}`}>
                <svg className={`h-5 w-5 ${tile.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--apple-text-primary)]">
                  {y.name}
                </p>
                <p className="mt-0.5 text-sm text-[var(--apple-text-tertiary)]">
                  {y.registrationNumber} · {y.marina}
                </p>
                {y.assignments && y.assignments.length > 0 && (
                  <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">
                    {y.assignments.length} crew assigned
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <Link
        href="/yachts"
        className="mt-4 block text-base font-medium text-[var(--apple-accent)] hover:underline"
      >
        View all yachts →
      </Link>
    </div>
  );
}
