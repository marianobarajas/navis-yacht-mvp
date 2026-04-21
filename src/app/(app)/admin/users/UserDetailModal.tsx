"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getUserWithAssignments, resetUserPassword, updateUserPermissionOverrides } from "@/actions/users";
import { listYachts, assignYachtToUser, unassignYachtFromUser } from "@/actions/yachts";
import { UserEditForm } from "./UserEditForm";
import {
  DeactivateUserButton,
  PermanentlyDeleteUserButton,
  ReactivateUserButton,
} from "./UserLifecycleButtons";
import { XIcon, PlusIcon } from "@/components/ui/Icons";
import { CustomSelect } from "@/components/ui/CustomSelect";
import Link from "next/link";
import { canAssignYacht, canEditUserRole, isManagerOrAbove } from "@/lib/rbac";
import { ROLE_LABELS, SHIFT_STATUS_LABELS } from "@/lib/crew";
import type { Role } from "@prisma/client";

const ALL_PERMISSIONS: { id: string; label: string }[] = [
  { id: "all_permissions", label: "All permissions" },
  { id: "manage_users_yachts", label: "Manage users and yachts" },
  { id: "create_assign_tasks", label: "Create and assign tasks" },
  { id: "full_system_access", label: "Full system access" },
  { id: "manage_yachts_crew", label: "Manage yachts and crew" },
  { id: "view_all_logs_documents", label: "View all logs and documents" },
  { id: "manage_team_members", label: "Manage team members" },
  { id: "view_assigned_yachts", label: "View assigned yachts" },
  { id: "create_logs", label: "Create logs" },
  { id: "update_task_status", label: "Update task status" },
  { id: "view_documents_assigned_yachts", label: "View documents for assigned yachts" },
  { id: "create_task_button", label: "Show + Add Task buttons" },
  { id: "create_crew_button", label: "Show + Add Crew buttons" },
  { id: "create_yacht_button", label: "Show + Add Yacht buttons" },
  { id: "create_calendar_event_button", label: "Show + Add Event buttons" },
  { id: "create_folder_button", label: "Show + Add Folder buttons" },
];

const PERM_CAPTAIN = ["all_permissions", "manage_users_yachts", "create_assign_tasks", "full_system_access", "manage_yachts_crew", "view_all_logs_documents", "manage_team_members", "view_assigned_yachts", "create_logs", "update_task_status", "view_documents_assigned_yachts", "create_task_button", "create_crew_button", "create_yacht_button", "create_calendar_event_button", "create_folder_button"];
const PERM_MANAGER = ["manage_yachts_crew", "create_assign_tasks", "view_all_logs_documents", "manage_team_members", "create_task_button", "create_crew_button", "create_yacht_button", "create_calendar_event_button", "create_folder_button"];
const PERM_CREW = ["view_assigned_yachts", "create_logs", "update_task_status", "view_documents_assigned_yachts"];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  CAPTAIN: PERM_CAPTAIN,
  CHIEF_ENGINEER: PERM_MANAGER,
  FIRST_MATE: PERM_MANAGER,
  BOSUN: PERM_MANAGER,
  DECKHAND_1: PERM_CREW,
  DECKHAND_2: PERM_CREW,
  CHEF: PERM_CREW,
  CHIEF_STEWARDESS: PERM_CREW,
  STEWARDESS_1: PERM_CREW,
  STEWARDESS_2: PERM_CREW,
};

function getDefaultForRole(role: string): Record<string, boolean> {
  const ids = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
  return Object.fromEntries(ALL_PERMISSIONS.map((p) => [p.id, ids.includes(p.id)]));
}

export function UserDetailModal({
  userId,
  actorRole,
  actorUserId,
  onClose,
}: {
  userId: string;
  actorRole: string;
  actorUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<{
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    shiftStatus?: string;
    permissionOverrides?: Record<string, boolean> | null;
    assignmentsAsUser: { yacht: { id: string; name: string; registrationNumber: string; marina: string } }[];
  } | null>(null);
  const [permissionPending, setPermissionPending] = useState(false);
  const [yachts, setYachts] = useState<{ id: string; name: string; registrationNumber: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedYachtId, setSelectedYachtId] = useState("");
  const [assignPending, setAssignPending] = useState(false);
  const [unassignPending, setUnassignPending] = useState<string | null>(null);
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [resetPwdNew, setResetPwdNew] = useState("");
  const [resetPwdConfirm, setResetPwdConfirm] = useState("");
  const [resetPwdError, setResetPwdError] = useState<string | null>(null);
  const [resetPwdPending, setResetPwdPending] = useState(false);

  const refreshData = useCallback(async () => {
    const res = await getUserWithAssignments(userId);
    if ((res as any)?.error) return;
    setData((res as any).data);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await getUserWithAssignments(userId);
      if (cancelled) return;
      if ((res as any)?.error) {
        setError((res as any).error);
        setData(null);
      } else {
        setData((res as any).data);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!data || !canAssignYacht(actorRole)) return;
    let cancelled = false;
    (async () => {
      const res = await listYachts();
      if (cancelled) return;
      if (!(res as any)?.error && (res as any)?.data) {
        setYachts((res as any).data);
      }
    })();
    return () => { cancelled = true; };
  }, [data, actorRole]);

  const ar = actorRole as Role;
  const canEdit = data && canEditUserRole(ar, data.role);
  const canEditPermissions = data && isManagerOrAbove(actorRole) && canEditUserRole(ar, data.role);
  const canModifyLifecycle = data && canEditUserRole(ar, data.role) && data.id !== actorUserId;
  const canAssign = data && canAssignYacht(actorRole);
  const canResetPwd = data && isManagerOrAbove(actorRole) && canEditUserRole(ar, data.role);

  const roleDefaults = data ? getDefaultForRole(data.role) : {};
  const permissionOverrides = data?.permissionOverrides ?? {};
  const isPermissionEnabled = (id: string) =>
    permissionOverrides[id] !== undefined ? permissionOverrides[id]! : roleDefaults[id] ?? false;

  const assignedYachtIds = data?.assignmentsAsUser.map((a) => a.yacht.id) ?? [];
  const availableYachts = yachts.filter((y) => !assignedYachtIds.includes(y.id));
  const yachtOptions = [{ value: "", label: "Select yacht…" }, ...availableYachts.map((y) => ({ value: y.id, label: `${y.name} (${y.registrationNumber})` }))];

  async function handleAssignYacht() {
    if (!selectedYachtId || !data) return;
    setAssignError(null);
    setAssignPending(true);
    try {
      const res = await assignYachtToUser(selectedYachtId, data.id);
      if ((res as any)?.error) {
        setAssignError((res as any).error);
        return;
      }
      setSelectedYachtId("");
      await refreshData();
      router.refresh();
    } finally {
      setAssignPending(false);
    }
  }

  async function handleUnassign(yachtId: string) {
    if (!data || !window.confirm("Remove this crew member from the yacht?")) return;
    setUnassignPending(yachtId);
    try {
      await unassignYachtFromUser(yachtId, data.id);
      await refreshData();
      router.refresh();
    } finally {
      setUnassignPending(null);
    }
  }

  async function handlePermissionToggle(permissionId: string) {
    if (!data || !canEditPermissions) return;
    const next = !isPermissionEnabled(permissionId);
    const newOverrides = { ...(data.permissionOverrides ?? {}), [permissionId]: next };
    setPermissionPending(true);
    try {
      const res = await updateUserPermissionOverrides(data.id, newOverrides);
      if ((res as any)?.error) return;
      setData((prev) => (prev ? { ...prev, permissionOverrides: newOverrides } : null));
      router.refresh();
    } finally {
      setPermissionPending(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetPwdError(null);
    if (resetPwdNew.length < 8) {
      setResetPwdError("Password must be at least 8 characters");
      return;
    }
    if (resetPwdNew !== resetPwdConfirm) {
      setResetPwdError("Passwords do not match");
      return;
    }
    if (!data) return;
    setResetPwdPending(true);
    try {
      const res = await resetUserPassword(data.id, resetPwdNew);
      if ((res as any)?.error) {
        setResetPwdError((res as any).error);
        return;
      }
      setResetPwdOpen(false);
      setResetPwdNew("");
      setResetPwdConfirm("");
    } finally {
      setResetPwdPending(false);
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="user-details-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative flex max-h-[90vh] min-h-[min(85vh,800px)] w-[calc(92vw-2rem)] max-w-7xl flex-col rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-6 py-4">
          <h2 id="user-details-title" className="text-xl font-semibold text-[var(--apple-text-primary)]">Manage user</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)] hover:text-[var(--apple-text-primary)]"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          {loading && <p className="text-sm text-[var(--apple-text-tertiary)]">Loading…</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

          {data && !loading && (
            <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-3 overflow-hidden">
              <section className="flex flex-col self-start overflow-hidden rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 p-5">
                <h3 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">User details</h3>
                {canEdit ? (
                  <UserEditForm
                    user={{
                      id: data.id,
                      name: data.name,
                      email: data.email,
                      role: data.role,
                      shiftStatus: data.shiftStatus,
                      isActive: data.isActive,
                    }}
                    actorRole={actorRole}
                    onClose={onClose}
                    compact
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div><span className="block text-[10px] font-medium text-[var(--apple-text-tertiary)]">Name</span><p className="font-medium text-[var(--apple-text-primary)]">{data.name}</p></div>
                    <div><span className="block text-[10px] font-medium text-[var(--apple-text-tertiary)]">Email</span><p className="truncate font-medium text-[var(--apple-text-primary)]" title={data.email}>{data.email}</p></div>
                    <div><span className="block text-[10px] font-medium text-[var(--apple-text-tertiary)]">Role</span><p className="font-medium text-[var(--apple-text-primary)]">{ROLE_LABELS[data.role]}</p></div>
                    <div><span className="block text-[10px] font-medium text-[var(--apple-text-tertiary)]">Crew status</span><p className="font-medium text-[var(--apple-text-primary)]">{data.shiftStatus ? SHIFT_STATUS_LABELS[data.shiftStatus as keyof typeof SHIFT_STATUS_LABELS] : "—"}</p></div>
                    <div><span className="block text-[10px] font-medium text-[var(--apple-text-tertiary)]">Active</span><p className="font-medium text-[var(--apple-text-primary)]">{data.isActive ? "Yes" : "No"}</p></div>
                  </div>
                )}
              </section>

              <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 p-5">
                <h3 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Permissions</h3>
                <ul className="flex flex-col gap-1.5 text-xs">
                  {ALL_PERMISSIONS.map((p) => {
                    const enabled = isPermissionEnabled(p.id);
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 text-left text-[var(--apple-text-primary)]">{p.label}</span>
                        {canEditPermissions ? (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            disabled={permissionPending}
                            onClick={() => handlePermissionToggle(p.id)}
                            className={`relative ml-auto inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent)] focus:ring-offset-1 disabled:opacity-50 ${
                              enabled ? "bg-[var(--apple-accent)]" : "bg-[var(--apple-border-strong)]"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 translate-y-0.5 transform rounded-full bg-[var(--apple-bg-elevated)] shadow transition-transform ${
                                enabled ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        ) : (
                          <span className={`text-[10px] font-medium ${enabled ? "text-[var(--apple-accent)]" : "text-[var(--apple-text-tertiary)]"}`}>
                            {enabled ? "On" : "Off"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className="flex min-h-0 flex-col gap-5 overflow-hidden">
                {canResetPwd && (
                  <section className="flex shrink-0 flex-col rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 p-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Reset password</h3>
                    {!resetPwdOpen ? (
                      <button
                        type="button"
                        onClick={() => setResetPwdOpen(true)}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/40"
                      >
                        Reset password
                      </button>
                    ) : (
                      <form onSubmit={handleResetPassword} className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">New password</label>
                          <input
                            type="password"
                            value={resetPwdNew}
                            onChange={(e) => setResetPwdNew(e.target.value)}
                            placeholder="Min 8 characters"
                            className="h-9 w-full rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-2.5 text-sm text-[var(--apple-text-primary)] placeholder:text-[var(--apple-text-tertiary)] focus:border-[var(--apple-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent-muted)]"
                            autoComplete="new-password"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">Confirm password</label>
                          <input
                            type="password"
                            value={resetPwdConfirm}
                            onChange={(e) => setResetPwdConfirm(e.target.value)}
                            placeholder="Confirm new password"
                            className="h-9 w-full rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-2.5 text-sm text-[var(--apple-text-primary)] placeholder:text-[var(--apple-text-tertiary)] focus:border-[var(--apple-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent-muted)]"
                            autoComplete="new-password"
                          />
                        </div>
                        {resetPwdError && <p className="text-xs text-red-600">{resetPwdError}</p>}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setResetPwdOpen(false); setResetPwdNew(""); setResetPwdConfirm(""); setResetPwdError(null); }}
                            className="rounded-lg border border-[var(--apple-border)] px-3 py-1.5 text-xs font-medium text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={resetPwdPending || !resetPwdNew || !resetPwdConfirm}
                            className="rounded-lg border border-amber-600 bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                          >
                            {resetPwdPending ? "Resetting…" : "Reset password"}
                          </button>
                        </div>
                      </form>
                    )}
                  </section>
                )}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 p-5">
                  <h3 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Yachts assigned</h3>
                  {canAssign && (
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <CustomSelect
                        value={selectedYachtId}
                        onChange={setSelectedYachtId}
                        options={yachtOptions}
                        placeholder={availableYachts.length > 0 ? "Select yacht…" : "No yachts to assign"}
                        className="min-w-[140px] max-w-[200px]"
                      />
                      <button
                        type="button"
                        onClick={handleAssignYacht}
                        disabled={availableYachts.length === 0 || !selectedYachtId || assignPending}
                        aria-label={availableYachts.length === 0 ? "All yachts already assigned" : "Assign yacht"}
                        title={availableYachts.length === 0 ? "All yachts already assigned" : "Assign yacht"}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      {availableYachts.length === 0 && (
                        <span className="text-[10px] text-[var(--apple-text-tertiary)]">All yachts assigned</span>
                      )}
                    </div>
                  )}
                  {assignError && <p className="mb-2 text-xs text-red-600">{assignError}</p>}
                  {data.assignmentsAsUser.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] p-3 text-center text-xs text-[var(--apple-text-tertiary)]">No yachts assigned</p>
                ) : (
                  <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[var(--apple-border)]">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]">
                          <th className="px-2 py-1.5 text-left font-medium text-[var(--apple-text-tertiary)]">Yacht</th>
                          <th className="px-2 py-1.5 text-left font-medium text-[var(--apple-text-tertiary)]">Reg.</th>
                          <th className="px-2 py-1.5 text-left font-medium text-[var(--apple-text-tertiary)]">Marina</th>
                          <th className="px-2 py-1.5 text-right font-medium text-[var(--apple-text-tertiary)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.assignmentsAsUser.map((a) => (
                          <tr key={a.yacht.id} className="border-b border-[var(--apple-border)] last:border-0">
                            <td className="px-2 py-1.5 font-medium text-[var(--apple-text-primary)]">
                              <Link href={`/yachts/${a.yacht.id}`} className="hover:text-[var(--apple-accent)] hover:underline">
                                {a.yacht.name}
                              </Link>
                            </td>
                            <td className="px-2 py-1.5 text-[var(--apple-text-secondary)]">{a.yacht.registrationNumber}</td>
                            <td className="px-2 py-1.5 text-[var(--apple-text-secondary)]">{a.yacht.marina}</td>
                            <td className="px-2 py-1.5 text-right">
                              <div className="flex items-center justify-end">
                                {canAssign && (
                                  <button
                                    type="button"
                                    onClick={() => handleUnassign(a.yacht.id)}
                                    disabled={unassignPending === a.yacht.id}
                                    aria-label={`Remove from ${a.yacht.name}`}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--apple-text-tertiary)] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                                  >
                                    <XIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                </section>
              </div>

              {canModifyLifecycle && (
                <div className="col-span-full flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--apple-border)] pt-4">
                  {data.isActive ? (
                    <DeactivateUserButton
                      userId={data.id}
                      userName={data.name}
                      actorUserId={actorUserId}
                      onDone={onClose}
                    />
                  ) : (
                    <ReactivateUserButton
                      userId={data.id}
                      userName={data.name}
                      actorUserId={actorUserId}
                      onDone={onClose}
                    />
                  )}
                  <PermanentlyDeleteUserButton
                    userId={data.id}
                    userName={data.name}
                    actorUserId={actorUserId}
                    onDone={onClose}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
