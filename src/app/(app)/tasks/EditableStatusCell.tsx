"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { WorkOrderStatus } from "@prisma/client";
import { updateWorkOrderStatus } from "@/actions/workOrders";

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: "OPEN", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const DISPLAY_LABELS: Record<WorkOrderStatus, string> = {
  OPEN: "To Do",
  IN_PROGRESS: "In Progress",
  WAITING_PARTS: "In Progress",
  DONE: "Done",
  CLOSED: "Done",
};

const statusStyles: Record<WorkOrderStatus, string> = {
  OPEN: "bg-[var(--apple-bg-subtle)] text-[var(--apple-text-secondary)]",
  IN_PROGRESS: "bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]",
  WAITING_PARTS: "bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]",
  DONE: "bg-[var(--ocean-success-muted)] text-[#2d7a55]",
  CLOSED: "bg-[var(--ocean-success-muted)] text-[#2d7a55]",
};

/** Large pill style (task cards) — navy / sand / teal to match reference mocks */
const statusStylesLg: Record<WorkOrderStatus, string> = {
  OPEN: "bg-[#e8e2d6] text-[#3d362c]",
  IN_PROGRESS: "bg-[var(--apple-accent)] text-white",
  WAITING_PARTS: "bg-[var(--apple-accent)] text-white",
  DONE: "bg-[#0f766e] text-white",
  CLOSED: "bg-[#0f766e] text-white",
};

const baseBadge =
  "inline-flex items-center gap-1 rounded-[var(--apple-radius-full)] px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer border border-transparent hover:border-[var(--apple-border-strong)] hover:ring-1 hover:ring-[var(--apple-border)]";

const baseBadgeLg =
  "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer border border-transparent shadow-sm hover:opacity-95";

const VALID_STATUSES = new Set<WorkOrderStatus>([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "DONE",
  "CLOSED",
]);

export function EditableStatusCell({
  workOrderId,
  currentStatus,
  canUpdate = true,
  size = "sm",
}: {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
  canUpdate?: boolean;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const status = VALID_STATUSES.has(currentStatus) ? currentStatus : "OPEN";
  const [pending, startTransition] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [showDropdown]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideButton = buttonRef.current?.contains(target);
      const insideDropdown = document
        .getElementById(`status-dropdown-${workOrderId}`)
        ?.contains(target);
      if (!insideButton && !insideDropdown) {
        setShowDropdown(false);
      }
    }
    function handleScroll() {
      setShowDropdown(false);
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [showDropdown, workOrderId]);

  async function handleStatusChange(newStatus: WorkOrderStatus) {
    if (newStatus === status) {
      setShowDropdown(false);
      return;
    }
    setError(null);
    setShowDropdown(false);

    startTransition(async () => {
      const res = await updateWorkOrderStatus(workOrderId, newStatus);
      if ((res as any)?.error) {
        setError((res as any).error);
        return;
      }
      router.refresh();
    });
  }

  const pillBase = size === "lg" ? baseBadgeLg : baseBadge;
  const pillStyle =
    size === "lg" ? statusStylesLg[status] : statusStyles[status];

  if (!canUpdate) {
    return (
      <span className={`${pillBase} ${pillStyle} cursor-default`}>
        {size === "lg" && (status === "DONE" || status === "CLOSED") ? (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : null}
        {DISPLAY_LABELS[status]}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        title={pending ? "Saving…" : "Click to change status"}
        className={`${pillBase} ${pillStyle} ${
          pending ? "opacity-70 cursor-wait" : ""
        }`}
      >
        {size === "lg" && !pending && (status === "DONE" || status === "CLOSED") ? (
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : null}
        {pending ? "Saving…" : DISPLAY_LABELS[status]}
        {!pending && (
          <svg
            className={`${size === "lg" ? "h-4 w-4" : "h-3 w-3"} shrink-0 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>

      {showDropdown &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={`status-dropdown-${workOrderId}`}
            data-no-row-nav
            className="apple-dropdown-panel fixed z-[100] min-w-[140px] w-max bg-[var(--apple-bg-elevated)] px-1 py-2 shadow-xl rounded-[var(--apple-radius)] border border-[var(--apple-border)]"
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              boxShadow: "var(--apple-shadow-dropdown)",
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map((opt) => {
              const isSelected =
                (opt.value === "OPEN" && (status === "OPEN")) ||
                (opt.value === "IN_PROGRESS" &&
                  (status === "IN_PROGRESS" || status === "WAITING_PARTS")) ||
                (opt.value === "DONE" && (status === "DONE" || status === "CLOSED"));
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(opt.value);
                  }}
                  className={`block w-full whitespace-nowrap rounded px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--apple-bg-subtle)] ${
                    isSelected
                      ? "font-medium text-[var(--apple-accent)]"
                      : "text-[var(--apple-text-primary)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}

      {error ? (
        <p className="mt-1 text-xs text-red-600" title={error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
