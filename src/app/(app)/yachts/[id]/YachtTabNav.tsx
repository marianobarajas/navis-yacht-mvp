"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function YachtTabNav({ yachtId }: { yachtId: string }) {
  const pathname = usePathname();
  const base = `/yachts/${yachtId}`;

  return (
    <div className="mt-6 flex gap-0.5 border-b border-[var(--apple-border)]">
      <Link
        href={base}
        className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          pathname === base
            ? "border-[var(--apple-accent)] text-[var(--apple-accent)]"
            : "border-transparent text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
        }`}
      >
        Overview
      </Link>
      <Link
        href={`${base}/work-orders`}
        className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          pathname === `${base}/work-orders`
            ? "border-[var(--apple-accent)] text-[var(--apple-accent)]"
            : "border-transparent text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
        }`}
      >
        Work Orders
      </Link>
      <Link
        href={`${base}/logs`}
        className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          pathname === `${base}/logs`
            ? "border-[var(--apple-accent)] text-[var(--apple-accent)]"
            : "border-transparent text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
        }`}
      >
        Logs
      </Link>
      <Link
        href={`${base}/crew`}
        className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          pathname === `${base}/crew`
            ? "border-[var(--apple-accent)] text-[var(--apple-accent)]"
            : "border-transparent text-[var(--apple-text-secondary)] hover:text-[var(--apple-text-primary)]"
        }`}
      >
        Crew
      </Link>
    </div>
  );
}
