"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateCurrentUser, updateOwnPassword } from "@/actions/users";
import { uploadProfileImage, removeProfileImage } from "@/actions/profile";
import {
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/actions/notifications";
import { CheckIcon } from "@/components/ui/Icons";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ["all_permissions", "manage_users_yachts", "create_assign_tasks", "full_system_access"],
  MANAGER: ["manage_yachts_crew", "create_assign_tasks", "view_all_logs_documents", "manage_team_members"],
  TECHNICIAN: ["view_assigned_yachts", "create_logs", "update_task_status", "view_documents_assigned_yachts"],
};

function getDefaultForRole(role: string): Record<string, boolean> {
  const ids = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
  return Object.fromEntries(ALL_PERMISSIONS.map((p) => [p.id, ids.includes(p.id)]));
}

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  shiftStatus: string | null;
  permissionOverrides: Record<string, boolean> | null;
  notificationPreferences: NotificationPreferences | null;
  profileImage: string | null;
  assignmentsAsUser: {
    yacht: { id: string; name: string; registrationNumber: string; marina: string };
  }[];
};

export function ProfileView({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(profile.name);
  const [shiftStatus, setShiftStatus] = useState(profile.shiftStatus ?? "OFF_DUTY");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(profile.profileImage);
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  const np = profile.notificationPreferences ?? {};
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    taskAssigned: np.taskAssigned !== false,
    dueToday: np.dueToday !== false,
    taskUpdated: np.taskUpdated !== false,
  });
  const [notifPrefsPending, setNotifPrefsPending] = useState(false);

  useEffect(() => {
    const p = profile.notificationPreferences ?? {};
    setNotifPrefs({
      taskAssigned: p.taskAssigned !== false,
      dueToday: p.dueToday !== false,
      taskUpdated: p.taskUpdated !== false,
    });
  }, [profile.notificationPreferences]);

  const roleDefaults = getDefaultForRole(profile.role);
  const overrides = profile.permissionOverrides ?? {};
  const isPermissionEnabled = (id: string) =>
    overrides[id] !== undefined ? overrides[id]! : roleDefaults[id] ?? false;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("shiftStatus", shiftStatus);
    startTransition(async () => {
      const res = await updateCurrentUser(formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const shiftOptions = [
    { value: "OFF_DUTY", label: "Off duty" },
    { value: "ON_SHIFT", label: "On shift" },
    { value: "UNAVAILABLE", label: "Unavailable" },
  ];

  async function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setUploadError(null);
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await uploadProfileImage(formData);
    setUploading(false);
    if (res.error) {
      setUploadError(res.error);
      return;
    }
    if (res.url) {
      setProfileImage(res.url);
      await updateSession({ profileImage: res.url });
    }
    router.refresh();
  }

  async function handleRemoveProfilePhoto() {
    setUploadError(null);
    setRemoving(true);
    const res = await removeProfileImage();
    setRemoving(false);
    if (res.error) {
      setUploadError(res.error);
      return;
    }
    setProfileImage(null);
    await updateSession({ profileImage: null });
    router.refresh();
  }

  async function handleNotificationToggle(key: keyof NotificationPreferences) {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    setNotifPrefsPending(true);
    await updateNotificationPreferences(next);
    setNotifPrefsPending(false);
    router.refresh();
  }

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordPending(true);
    const res = await updateOwnPassword(currentPassword, newPassword);
    setPasswordPending(false);
    if (res.error) {
      setPasswordError(res.error);
      return;
    }
    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordFormOpen(false);
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-3">
      {/* User details – editable */}
      <section className="flex min-h-0 flex-col overflow-auto rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4">
        <h2 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">
          User details
        </h2>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-[var(--apple-border)] bg-[var(--apple-accent)]">
            {profileImage ? (
              <img src={profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                {profile.name.charAt(0) ?? "?"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              aria-hidden
              onChange={handleProfilePhotoChange}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--apple-text-primary)] hover:bg-[var(--apple-bg-subtle)] disabled:opacity-60"
              >
                {uploading ? "…" : "Update photo"}
              </button>
              {profileImage && (
                <button
                  type="button"
                  disabled={removing}
                  onClick={handleRemoveProfilePhoto}
                  className="rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--apple-text-tertiary)] hover:bg-[var(--apple-bg-subtle)] disabled:opacity-60"
                >
                  {removing ? "…" : "Remove"}
                </button>
              )}
            </div>
          </div>
        </div>
        {uploadError && (
          <p className="mb-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600" role="alert">{uploadError}</p>
        )}
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div className="col-span-2 grid gap-1">
            <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="apple-input h-9 w-full px-3 py-2 text-sm"
              placeholder="Full name"
              required
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Email</label>
            <p className="truncate rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-3 py-2 text-xs text-[var(--apple-text-secondary)]" title={profile.email}>
              {profile.email}
            </p>
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Role</label>
            <p className="rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-3 py-2 text-xs font-medium text-[var(--apple-text-primary)]">
              {profile.role}
            </p>
          </div>
          <div className="col-span-2 grid gap-1">
            <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Shift status</label>
            <CustomSelect
              name="shiftStatus"
              value={shiftStatus}
              onChange={(v) => setShiftStatus(v)}
              options={shiftOptions}
              triggerClassName="h-9 border-[var(--apple-accent)]/50 bg-[var(--apple-bg-subtle)]/80 text-sm"
              emphasizeValue
            />
          </div>
          {error && (
            <p className="col-span-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600" role="alert">{error}</p>
          )}
          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--apple-accent)] bg-[var(--apple-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--apple-accent-hover)] disabled:opacity-60"
            >
              <CheckIcon className="h-4 w-4" />
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>

        <div className="mt-4 border-t border-[var(--apple-border)] pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">
            Password
          </h3>
          {!passwordFormOpen ? (
            <button
              type="button"
              onClick={() => {
                setPasswordFormOpen(true);
                setPasswordError(null);
                setPasswordSuccess(false);
              }}
              className="rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--apple-text-primary)] hover:bg-[var(--apple-bg-subtle)]"
            >
              Update password
            </button>
          ) : (
            <form onSubmit={handleUpdatePassword} className="grid gap-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Current</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="apple-input h-8 w-full px-3 py-2 text-xs"
                  placeholder="Current password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-[var(--apple-text-secondary)]">New</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="apple-input h-8 w-full px-3 py-2 text-xs"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-[var(--apple-text-secondary)]">Confirm</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="apple-input h-8 w-full px-3 py-2 text-xs"
                  placeholder="Confirm"
                  required
                  autoComplete="new-password"
                />
              </div>
              {(passwordError || passwordSuccess) && (
                <p className={`rounded-lg px-2.5 py-1.5 text-xs ${passwordError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`} role={passwordError ? "alert" : "status"}>
                  {passwordError ?? "Password updated."}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordFormOpen(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError(null);
                    setPasswordSuccess(false);
                  }}
                  className="rounded-lg border border-[var(--apple-border)] px-3 py-2 text-xs font-medium text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--apple-accent)] bg-[var(--apple-accent)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--apple-accent-hover)] disabled:opacity-60"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  {passwordPending ? "…" : "Update"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Permissions – read-only, scrollable */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4">
        <h2 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">
          Permissions
        </h2>
        <ul className="min-h-0 flex-1 overflow-auto pr-1">
          {ALL_PERMISSIONS.map((p) => {
            const enabled = isPermissionEnabled(p.id);
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 py-1 text-xs">
                <span className="min-w-0 truncate text-[var(--apple-text-primary)]">{p.label}</span>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    enabled ? "bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]" : "bg-[var(--apple-bg-subtle)] text-[var(--apple-text-tertiary)]"
                  }`}
                >
                  {enabled ? "On" : "Off"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Right column: Yachts (reduced) + Manage notifications below */}
      <div className="flex min-h-0 flex-col gap-4">
        {/* Yachts assigned – reduced height, scrollable */}
        <section className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4">
          <h2 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">
            Yachts assigned
          </h2>
          {profile.assignmentsAsUser.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] p-3 text-center text-xs text-[var(--apple-text-tertiary)]">
              No yachts assigned
            </p>
          ) : (
            <div className="max-h-28 overflow-auto rounded-lg border border-[var(--apple-border)]">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-[var(--apple-bg-subtle)]">
                  <tr className="border-b border-[var(--apple-border)]">
                    <th className="px-3 py-2 text-left font-medium text-[var(--apple-text-tertiary)]">Yacht</th>
                    <th className="px-3 py-2 text-left font-medium text-[var(--apple-text-tertiary)]">Reg.</th>
                    <th className="px-3 py-2 text-left font-medium text-[var(--apple-text-tertiary)]">Marina</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.assignmentsAsUser.map((a) => (
                    <tr key={a.yacht.id} className="border-b border-[var(--apple-border)] last:border-0">
                      <td className="px-3 py-2 font-medium text-[var(--apple-text-primary)]">
                        <Link href={`/yachts/${a.yacht.id}`} className="block max-w-[120px] truncate text-[var(--apple-accent)] hover:underline">
                          {a.yacht.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-[var(--apple-text-secondary)]">{a.yacht.registrationNumber}</td>
                      <td className="max-w-[90px] truncate px-3 py-2 text-[var(--apple-text-secondary)]">{a.yacht.marina}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Manage notifications – directly below Yachts */}
        <section className="flex shrink-0 flex-col overflow-visible rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">
            Manage notifications
          </h2>
          <p className="mb-3 text-xs text-[var(--apple-text-secondary)]">
            Choose which notifications you receive in the bell menu.
          </p>
          <ul className="flex flex-col gap-2">
            <li className="flex items-center justify-between gap-3 rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 px-3 py-2.5">
              <div className="min-w-0">
                <span className="text-xs font-medium text-[var(--apple-text-primary)]">Task assigned to you</span>
                <p className="mt-0.5 text-[10px] text-[var(--apple-text-tertiary)]">When a task is assigned to you</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifPrefs.taskAssigned}
                disabled={notifPrefsPending}
                onClick={() => handleNotificationToggle("taskAssigned")}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent)] focus:ring-offset-1 disabled:opacity-50 ${
                  notifPrefs.taskAssigned ? "bg-[var(--apple-accent)]" : "bg-[var(--apple-border-strong)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-[var(--apple-bg-elevated)] shadow transition-transform ${
                    notifPrefs.taskAssigned ? "translate-x-4" : "translate-x-0.5"
                  }`}
                  style={{ marginTop: 2 }}
                />
              </button>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 px-3 py-2.5">
              <div className="min-w-0">
                <span className="text-xs font-medium text-[var(--apple-text-primary)]">Tasks due today</span>
                <p className="mt-0.5 text-[10px] text-[var(--apple-text-tertiary)]">Reminder for tasks due today</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifPrefs.dueToday}
                disabled={notifPrefsPending}
                onClick={() => handleNotificationToggle("dueToday")}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent)] focus:ring-offset-1 disabled:opacity-50 ${
                  notifPrefs.dueToday ? "bg-[var(--apple-accent)]" : "bg-[var(--apple-border-strong)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-[var(--apple-bg-elevated)] shadow transition-transform ${
                    notifPrefs.dueToday ? "translate-x-4" : "translate-x-0.5"
                  }`}
                  style={{ marginTop: 2 }}
                />
              </button>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-lg border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 px-3 py-2.5">
              <div className="min-w-0">
                <span className="text-xs font-medium text-[var(--apple-text-primary)]">Task updated</span>
                <p className="mt-0.5 text-[10px] text-[var(--apple-text-tertiary)]">Status, comments, or other updates</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifPrefs.taskUpdated}
                disabled={notifPrefsPending}
                onClick={() => handleNotificationToggle("taskUpdated")}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--apple-accent)] focus:ring-offset-1 disabled:opacity-50 ${
                  notifPrefs.taskUpdated ? "bg-[var(--apple-accent)]" : "bg-[var(--apple-border-strong)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-[var(--apple-bg-elevated)] shadow transition-transform ${
                    notifPrefs.taskUpdated ? "translate-x-4" : "translate-x-0.5"
                  }`}
                  style={{ marginTop: 2 }}
                />
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
