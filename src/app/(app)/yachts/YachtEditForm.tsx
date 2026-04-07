"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateYacht } from "@/actions/yachts";
import { YachtCoverPlaceholder } from "@/components/yachts/YachtCoverPlaceholder";
import { CustomSelect } from "@/components/ui/CustomSelect";

type YachtForEdit = {
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
  assignmentCount?: number;
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DOCKED", label: "Docked" },
  { value: "IN_SERVICE", label: "In service" },
];

const HEALTH_OPTIONS = [
  { value: "Good", label: "Good" },
  { value: "Warning", label: "Warning" },
  { value: "Poor", label: "Poor" },
];

export function YachtEditForm({
  yacht,
  onClose,
}: {
  yacht: YachtForEdit;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [yachtStatus, setYachtStatus] = useState(yacht.yachtStatus ?? "ACTIVE");
  const [maintenanceHealth, setMaintenanceHealth] = useState(() => {
    const m = yacht.maintenanceHealth?.trim();
    if (!m) return "Good";
    const lower = m.toLowerCase();
    if (lower.includes("warn")) return "Warning";
    if (lower.includes("poor") || lower.includes("bad")) return "Poor";
    return "Good";
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("yachtStatus", yachtStatus);
    formData.set("maintenanceHealth", maintenanceHealth);

    startTransition(async () => {
      const res = await updateYacht(yacht.id, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  const crewCount = yacht.assignmentCount ?? 0;

  return (
    <form onSubmit={onSubmit} className="grid gap-5" encType="multipart/form-data">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Yacht name</label>
        <input
          name="name"
          required
          defaultValue={yacht.name}
          className="apple-input w-full px-3 py-2.5 text-sm"
          placeholder="e.g. Sea Breeze"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Registration #</label>
          <input
            name="registrationNumber"
            required
            defaultValue={yacht.registrationNumber}
            className="apple-input w-full px-3 py-2.5 text-sm"
            placeholder="e.g. REG001"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Year</label>
          <input
            name="year"
            type="number"
            min={1900}
            max={2100}
            required
            defaultValue={yacht.year}
            className="apple-input w-full px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Owner</label>
          <input
            name="ownerName"
            required
            defaultValue={yacht.ownerName}
            className="apple-input w-full px-3 py-2.5 text-sm"
            placeholder="Owner name"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Marina / location</label>
          <input
            name="marina"
            required
            defaultValue={yacht.marina}
            className="apple-input w-full px-3 py-2.5 text-sm"
            placeholder="e.g. Marina One, Miami, FL"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Model</label>
        <input
          name="model"
          required
          defaultValue={yacht.model}
          className="apple-input w-full px-3 py-2.5 text-sm"
          placeholder="e.g. Sunseeker 75"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Status</label>
        <CustomSelect
          value={yachtStatus}
          onChange={(v) => setYachtStatus(v)}
          options={STATUS_OPTIONS}
          emphasizeValue
        />
        <input type="hidden" name="yachtStatus" value={yachtStatus} />
      </div>

      <div>
        <Link
          href={`/yachts/${yacht.id}/crew`}
          className="flex w-full items-center justify-between rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-4 py-3 text-sm font-medium text-[var(--apple-text-primary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)]"
        >
          <span>Crew assigned</span>
          <span className="flex items-center gap-1 text-[var(--apple-text-secondary)]">
            {crewCount} crew
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">Maintenance health</label>
        <CustomSelect
          value={maintenanceHealth}
          onChange={(v) => setMaintenanceHealth(v)}
          options={HEALTH_OPTIONS}
          emphasizeValue
        />
        <input type="hidden" name="maintenanceHealth" value={maintenanceHealth} />
      </div>

      <div className="grid gap-2 border-t border-[var(--apple-border-muted)] pt-5">
        <span className="text-sm font-medium text-[var(--apple-text-secondary)]">Cover photo</span>
        {yacht.coverImageUrl ? (
          <div className="relative h-36 w-full overflow-hidden rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-muted)]">
            <img src={yacht.coverImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-[var(--apple-radius)] border border-[var(--apple-border)]">
            <YachtCoverPlaceholder yachtId={yacht.id} />
            <span className="relative z-10 rounded-full bg-[rgba(246,248,247,0.88)] px-3 py-1.5 text-sm font-medium text-[var(--palette-peacock)] shadow-sm backdrop-blur-[2px]">
              No cover photo
            </span>
          </div>
        )}
        <input
          name="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-[var(--apple-text-secondary)] file:mr-3 file:rounded-[var(--apple-radius-sm)] file:border-0 file:bg-[var(--apple-accent-muted)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--apple-accent)]"
        />
        <p className="text-xs text-[var(--apple-text-tertiary)]">JPEG, PNG, or WebP · max 5MB</p>
        {yacht.coverImageUrl ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--apple-text-secondary)]">
            <input type="checkbox" name="removeCoverImage" className="rounded border-[var(--apple-border-strong)]" />
            Remove cover photo
          </label>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-[var(--apple-radius-sm)] bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--apple-border-muted)] pt-5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[var(--apple-radius)] border border-[var(--apple-border-strong)] bg-[var(--apple-bg-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--apple-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
