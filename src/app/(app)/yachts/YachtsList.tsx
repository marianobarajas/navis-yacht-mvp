"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { YachtCoverPlaceholder } from "@/components/yachts/YachtCoverPlaceholder";
import { YachtCreateModal } from "./YachtCreateModal";

type Yacht = {
  id: string;
  name: string;
  registrationNumber: string;
  model: string;
  year: number;
  ownerName: string;
  marina: string;
  yachtStatus?: string;
  maintenanceHealth?: string | null;
  coverImageUrl?: string | null;
  assignments: { user: { id: string; name: string; profileImage?: string | null } }[];
};

function fleetKind(y: Yacht): "active" | "docked" | "service" {
  const st = y.yachtStatus;
  if (st === "DOCKED") return "docked";
  if (st === "IN_SERVICE") return "service";
  if (st === "ACTIVE") return "active";
  const h = (y.maintenanceHealth ?? "").toLowerCase();
  if (h.includes("dock")) return "docked";
  if (h.includes("warn") || h.includes("service") || h.includes("repair")) return "service";
  return "active";
}

function statusForKind(kind: "active" | "docked" | "service") {
  switch (kind) {
    case "active":
      return {
        label: "Active",
        className: "bg-[var(--ocean-teal-muted)] text-[#1f6569]",
      };
    case "docked":
      return {
        label: "Docked",
        className: "bg-[var(--palette-dusty-blue)]/90 text-[var(--apple-accent)]",
      };
    case "service":
      return {
        label: "In service",
        className: "bg-[rgba(246,227,184,0.85)] text-[#6b5420]",
      };
  }
}

function healthUi(y: Yacht) {
  const t = (y.maintenanceHealth ?? "").toLowerCase();
  if (t.includes("warn") || t.includes("poor") || t.includes("bad")) {
    return {
      label: "Warning",
      className: "bg-[rgba(196,140,114,0.35)] text-[#8b6048]",
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    };
  }
  return {
    label: "Good",
    className: "bg-[var(--ocean-success-muted)] text-[#0f766e]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  };
}

export function YachtsList({
  yachts,
  canManage,
}: {
  yachts: Yacht[];
  canManage: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return yachts;
    return yachts.filter(
      (y) =>
        y.name.toLowerCase().includes(q) ||
        y.registrationNumber.toLowerCase().includes(q) ||
        y.marina.toLowerCase().includes(q)
    );
  }, [yachts, search]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--apple-text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search yachts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="apple-input w-full py-3 pl-11 pr-4 text-base"
            aria-label="Search yachts"
          />
        </div>
        {canManage ? <YachtCreateModal /> : null}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-12 text-center text-[var(--apple-text-secondary)] shadow-[var(--apple-shadow-sm)]">
            No yachts found
          </div>
        ) : (
          filtered.map((y) => {
            const kind = fleetKind(y);
            const status = statusForKind(kind);
            const health = healthUi(y);
            const crew = y.assignments.slice(0, 4);
            const cover = y.coverImageUrl?.trim() || null;

            return (
              <Link
                key={y.id}
                href={`/yachts/${y.id}`}
                className="flex flex-col overflow-hidden rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)] transition-shadow hover:shadow-[var(--apple-shadow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--apple-accent)]"
              >
                <div className="relative h-44 w-full shrink-0">
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <YachtCoverPlaceholder yachtId={y.id} />
                  )}
                  <span
                    className={`pointer-events-none absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 truncate text-lg font-bold text-[var(--apple-text-primary)]">{y.name}</h3>
                    <span className={`pointer-events-none shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">
                    {y.registrationNumber} · {y.model} · {y.year}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--apple-accent-muted)] text-sm font-semibold text-[var(--apple-accent)]">
                      {y.ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--apple-text-primary)]">{y.ownerName}</p>
                      <p className="truncate text-xs text-[var(--apple-text-tertiary)]">Owner</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--apple-border-muted)] pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {crew.length === 0 ? (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--apple-bg-elevated)] bg-[var(--apple-bg-muted)] text-xs text-[var(--apple-text-tertiary)]">
                            —
                          </span>
                        ) : (
                          crew.map((a) => (
                            <div
                              key={a.user.id}
                              className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-[var(--apple-bg-elevated)] bg-[var(--apple-accent-muted)] text-xs font-semibold text-[var(--apple-accent)]"
                              title={a.user.name}
                            >
                              {a.user.profileImage ? (
                                <img src={a.user.profileImage} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center">
                                  {a.user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <span className="text-sm font-medium text-[var(--apple-text-secondary)]">
                        {y.assignments.length} crew
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${health.className}`}
                    >
                      {health.icon}
                      {health.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-start gap-2 border-t border-[var(--apple-border-muted)] pt-3 text-sm text-[var(--apple-text-secondary)]">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--apple-text-tertiary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{y.marina}</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-10 flex items-start gap-3 rounded-[var(--apple-radius-lg)] border border-[rgba(90,143,143,0.25)] bg-[var(--ocean-teal-muted)]/35 px-4 py-3 text-sm text-[var(--apple-text-primary)]">
        <span className="text-lg" aria-hidden>
          💡
        </span>
        <p>
          <span className="font-medium">Tip:</span> Click on any yacht to view details, logs, assign tasks, and manage crew.
        </p>
      </div>
    </div>
  );
}
