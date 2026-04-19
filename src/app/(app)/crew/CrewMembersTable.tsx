"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Role, ShiftStatus } from "@prisma/client";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { RoleBadge, ShiftBadge } from "@/components/ui/Badge";
import {
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/ui/Icons";
import { CrewEditModal, type CrewEditUserLite } from "./CrewEditButton";
import { deactivateUser } from "@/actions/users";
import { ROLE_SELECT_OPTIONS, SHIFT_STATUS_SELECT_OPTIONS } from "@/lib/crew";

export type CrewTableRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  shiftStatus: ShiftStatus;
  isActive: boolean;
  profileImage: string | null;
  assignmentsAsUser: { yacht: { id: string; name: string } }[];
};

type YachtOption = { id: string; name: string };

function hueFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

function CrewRowActions({
  user,
  canManage,
  actorRole,
}: {
  user: CrewTableRow;
  canManage: boolean;
  actorRole: Role;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const editUser: CrewEditUserLite = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    shiftStatus: user.shiftStatus,
    isActive: user.isActive,
  };

  function onDelete() {
    if (!window.confirm(`Deactivate ${user.name}? They will lose access until reactivated.`)) return;
    startTransition(async () => {
      const res = await deactivateUser(user.id);
      if ((res as { error?: string })?.error) {
        alert((res as { error: string }).error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!canManage) {
    return <span className="text-xs text-[var(--apple-text-tertiary)]">—</span>;
  }

  return (
    <div className="relative flex justify-end" ref={wrapRef}>
      <button
        type="button"
        aria-label="Actions"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-muted)]"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] py-1 shadow-[var(--apple-shadow-dropdown)]">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setOpen(false);
              setEditOpen(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--apple-text-primary)] hover:bg-[var(--apple-bg-subtle)]"
          >
            <PencilIcon className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </button>
        </div>
      ) : null}

      <CrewEditModal user={editUser} open={editOpen} onClose={() => setEditOpen(false)} actorRole={actorRole} />
    </div>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const hue = hueFromString(name);
  if (src) {
    return (
      <img src={src} alt="" className="h-10 w-10 rounded-full object-cover" />
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm ring-1 ring-black/10"
      style={{ backgroundColor: `hsl(${hue} 42% 42%)` }}
    >
      {initial}
    </div>
  );
}

export function CrewMembersTable({
  crew,
  yachts,
  canManage,
  actorRole,
}: {
  crew: CrewTableRow[];
  yachts: YachtOption[];
  canManage: boolean;
  actorRole: Role;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  const roleFilter = searchParams.get("role") ?? "";
  const status = searchParams.get("status") ?? "";
  const yachtId = searchParams.get("yachtId") ?? "";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/crew?${params.toString()}`);
  }

  const summaryYachtId = yachtId || null;
  const summaryYachtName =
    summaryYachtId && yachts.find((y) => y.id === summaryYachtId)?.name;

  const assignedCount = useMemo(() => {
    if (!summaryYachtId) return null;
    return crew.filter((c) =>
      c.assignmentsAsUser.some((a) => a.yacht.id === summaryYachtId)
    ).length;
  }, [crew, summaryYachtId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return crew;
    return crew.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [crew, search]);

  const yachtFilterOptions = [
    { value: "", label: "All yachts" },
    ...yachts.map((y) => ({ value: y.id, label: y.name })),
  ];

  const roleFilterOptions = [
    { value: "", label: "All roles" },
    ...ROLE_SELECT_OPTIONS,
  ];

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-[var(--apple-text-secondary)]">
          <span className="font-semibold text-[var(--apple-text-primary)]">{crew.length}</span> crew
          members
          {summaryYachtName != null && assignedCount != null ? (
            <>
              {" "}
              ·{" "}
              <span className="font-semibold text-[var(--apple-text-primary)]">{assignedCount}</span>{" "}
              assigned to {summaryYachtName}
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs sm:flex-initial">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--apple-text-tertiary)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="apple-input w-full py-2.5 pl-9 pr-3 text-sm"
              aria-label="Search users"
            />
          </div>
          <CustomSelect
            value={roleFilter}
            onChange={(v) => setParam("role", v)}
            placeholder="Filter by role"
            className="min-w-[170px]"
            options={roleFilterOptions}
          />
          <CustomSelect
            value={yachtId}
            onChange={(v) => setParam("yachtId", v)}
            placeholder="Yacht"
            className="min-w-[160px]"
            options={yachtFilterOptions}
          />
          <CustomSelect
            value={status}
            onChange={(v) => setParam("status", v)}
            placeholder="Crew status"
            className="min-w-[160px]"
            options={[{ value: "", label: "All statuses" }, ...SHIFT_STATUS_SELECT_OPTIONS]}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[var(--apple-radius-lg)] border border-[var(--apple-border-muted)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)]">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/80">
              <th className="px-4 py-3 font-semibold text-[var(--apple-text-secondary)]">Name</th>
              <th className="px-4 py-3 font-semibold text-[var(--apple-text-secondary)]">Email</th>
              <th className="px-4 py-3 font-semibold text-[var(--apple-text-secondary)]">Role</th>
              <th className="px-4 py-3 font-semibold text-[var(--apple-text-secondary)]">Account</th>
              <th className="px-4 py-3 font-semibold text-[var(--apple-text-secondary)]">Crew status</th>
              <th className="px-4 py-3 pr-6 text-right font-semibold text-[var(--apple-text-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--apple-text-tertiary)]">
                  No crew members match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--apple-border-muted)] last:border-0 hover:bg-[var(--apple-bg-muted)]/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} src={row.profileImage} />
                      <span className="font-medium text-[var(--apple-text-primary)]">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--apple-text-secondary)]">{row.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={row.role} />
                  </td>
                  <td className="px-4 py-3">
                    {row.isActive ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm ring-1 ring-emerald-700/30" />
                        Active
                      </span>
                    ) : (
                      <span className="font-medium text-[var(--apple-text-tertiary)]">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ShiftBadge status={row.shiftStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CrewRowActions user={row} canManage={canManage} actorRole={actorRole} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
