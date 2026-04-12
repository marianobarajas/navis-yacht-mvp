"use client";

import {
  Fragment,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CheckIcon, XIcon, PencilIcon, TrashIcon, PlusIcon } from "@/components/ui/Icons";
import { ExpenseLogsPdfExportButton } from "./ExpenseLogsPdfExportButton";
import { formatDateDDMMYY, toDateInputValue } from "@/lib/dateUtils";
import {
  createExpenseLog,
  updateExpenseLog,
  deleteExpenseLog,
  updateExpenseLogStatus,
} from "@/actions/expenseLogs";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { ExpenseLog } from "@prisma/client";

type ExpenseLogStatus = "PENDING_APPROVAL" | "APPROVED" | "PAID";

type Yacht = { id: string; name: string };
type User = { id: string; name: string };

function formatCostPlain(cost: number | string): string {
  const n = typeof cost === "string" ? parseFloat(cost) : cost;
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatUsd(n: number): string {
  return usdFormatter.format(Number.isFinite(n) ? n : 0);
}

function getCostNum(log: { cost: number | string | unknown }): number {
  const c = log.cost as { toNumber?: () => number } | number | string;
  if (c != null && typeof c === "object" && typeof (c as { toNumber?: () => number }).toNumber === "function") {
    return (c as { toNumber: () => number }).toNumber();
  }
  if (typeof c === "number") return c;
  const n = parseFloat(String(c));
  return Number.isNaN(n) ? 0 : n;
}

function getMonthKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthHeader(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export type ExpensePeriod = "all" | "week" | "month" | "quarter" | "year" | "custom";

function normalizePeriod(raw: string | null): ExpensePeriod {
  const allowed: ExpensePeriod[] = ["all", "week", "month", "quarter", "year", "custom"];
  if (raw && allowed.includes(raw as ExpensePeriod)) return raw as ExpensePeriod;
  return "all";
}

function parseLogDate(d: unknown): Date {
  if (d instanceof Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  }
  const x = new Date(String(d));
  if (Number.isNaN(x.getTime())) return new Date();
  return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 12, 0, 0, 0);
}

function startOfWeekMonday(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Inclusive calendar range for the given rolling period (current week / month / quarter / year). */
export function getDateRangeForPeriod(period: ExpensePeriod, now = new Date()): { start: Date; end: Date } | null {
  if (period === "all") return null;

  if (period === "week") {
    const start = startOfWeekMonday(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start, end };
  }

  return null;
}

function logInPeriod(log: { date: Date | string }, range: { start: Date; end: Date } | null): boolean {
  if (!range) return true;
  const t = new Date(typeof log.date === "string" ? log.date : log.date).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

const PERIOD_OPTIONS: { value: ExpensePeriod; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

function defaultCustomRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const toLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return { from: toLocal(start), to: toLocal(end) };
}

export function ExpenseLogsView({
  yachts,
  selectedYachtId,
  logs,
  error,
  users,
  canCreateTask,
  title,
  subtitle,
}: {
  yachts: Yacht[];
  selectedYachtId: string | null;
  logs: ExpenseLog[];
  error: string | null;
  users: User[];
  canCreateTask: boolean;
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const period = normalizePeriod(searchParams.get("period"));
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  function selectYacht(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("yachtId", id);
    router.push(`/logs?${params.toString()}`);
  }

  function setPeriod(next: ExpensePeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("period");
      params.delete("from");
      params.delete("to");
    } else if (next === "custom") {
      params.set("period", "custom");
      const d = defaultCustomRange();
      if (!params.get("from")) params.set("from", d.from);
      if (!params.get("to")) params.set("to", d.to);
    } else {
      params.set("period", next);
      params.delete("from");
      params.delete("to");
    }
    router.push(`/logs?${params.toString()}`);
  }

  function setCustomRange(from: string, to: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("from", from);
    params.set("to", to);
    router.push(`/logs?${params.toString()}`);
  }

  const effectiveYachtId =
    yachts.length === 0 ? null : (selectedYachtId ?? yachts[0]?.id ?? null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTotalsDropdown, setShowTotalsDropdown] = useState(false);
  const totalsRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => {
    if (period === "custom") {
      if (!fromParam || !toParam) return null;
      const start = new Date(fromParam);
      const end = new Date(toParam);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
      if (end < start) return null;
      return { start, end };
    }
    return getDateRangeForPeriod(period);
  }, [period, fromParam, toParam]);

  const periodLabel = useMemo(() => {
    if (period === "all") return "All time";
    if (period === "custom" && range) {
      return `${range.start.toLocaleDateString()} – ${range.end.toLocaleDateString()}`;
    }
    return PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
  }, [period, range]);

  const filteredLogs = useMemo(() => {
    if (period === "custom") {
      if (!range) return [];
      return logs.filter((l) => logInPeriod(l, range));
    }
    if (!range) return logs;
    return logs.filter((l) => logInPeriod(l, range));
  }, [logs, range, period]);

  const status = (l: { status?: string; isDone?: boolean }) => {
    const s = l.status as string | undefined;
    if (s === "DONE" || s === "PAID") return "PAID" as ExpenseLogStatus;
    if (s === "IN_PROGRESS" || s === "APPROVED") return "APPROVED" as ExpenseLogStatus;
    if (s === "NOT_STARTED" || s === "PENDING_APPROVAL") return "PENDING_APPROVAL" as ExpenseLogStatus;
    return (l.status as ExpenseLogStatus) ?? (l.isDone ? "PAID" : "PENDING_APPROVAL");
  };
  const totalLogs = filteredLogs.length;
  const pendingLogs = filteredLogs.filter((l) => status(l) !== "PAID").length;
  const totalCost = filteredLogs.reduce((sum, l) => sum + getCostNum(l), 0);
  const pendingCost = filteredLogs.filter((l) => status(l) !== "PAID").reduce((sum, l) => sum + getCostNum(l), 0);

  const chartBars = useMemo(() => {
    if (filteredLogs.length === 0) return [] as { key: string; amount: number; pct: number; title: string }[];

    const maxOf = (amounts: number[]) => Math.max(...amounts, 1);

    if (period === "custom" && range) {
      const dayMs = 86400000;
      const spanDays = Math.ceil((range.end.getTime() - range.start.getTime()) / dayMs) + 1;
      if (spanDays <= 62) {
        const buckets: { key: string; amount: number; title: string }[] = [];
        const cur = new Date(range.start);
        cur.setHours(0, 0, 0, 0);
        const endT = range.end.getTime();
        while (cur.getTime() <= endT) {
          const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
          buckets.push({
            key,
            amount: 0,
            title: cur.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          });
          cur.setDate(cur.getDate() + 1);
        }
        for (const l of filteredLogs) {
          const pd = parseLogDate(l.date);
          const key = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}-${String(pd.getDate()).padStart(2, "0")}`;
          const b = buckets.find((x) => x.key === key);
          if (b) b.amount += getCostNum(l);
        }
        const m = maxOf(buckets.map((b) => b.amount));
        return buckets.map((b) => ({ ...b, pct: Math.max((b.amount / m) * 100, 6) }));
      }
    }

    if (period === "week" || period === "month") {
      const r = getDateRangeForPeriod(period)!;
      const buckets: { key: string; amount: number; title: string }[] = [];
      const cur = new Date(r.start);
      const endT = r.end.getTime();
      while (cur.getTime() <= endT) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        buckets.push({
          key,
          amount: 0,
          title:
            period === "week"
              ? cur.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })
              : String(cur.getDate()),
        });
        cur.setDate(cur.getDate() + 1);
      }
      for (const l of filteredLogs) {
        const pd = parseLogDate(l.date);
        const key = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}-${String(pd.getDate()).padStart(2, "0")}`;
        const b = buckets.find((x) => x.key === key);
        if (b) b.amount += getCostNum(l);
      }
      const m = maxOf(buckets.map((b) => b.amount));
      return buckets.map((b) => ({ ...b, pct: Math.max((b.amount / m) * 100, 6) }));
    }

    const map = new Map<string, number>();
    for (const l of filteredLogs) {
      const k = getMonthKey(parseLogDate(l.date));
      map.set(k, (map.get(k) ?? 0) + getCostNum(l));
    }
    let entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (period === "all") entries = entries.slice(-6);
    const m = maxOf(entries.map(([, v]) => v));
    return entries.map(([k, v]) => ({
      key: k,
      amount: v,
      pct: Math.max((v / m) * 100, 6),
      title: formatMonthHeader(`${k}-01T12:00:00`),
    }));
  }, [filteredLogs, period, range]);

  const barColors = [
    "bg-[var(--palette-dusty-blue)]",
    "bg-[var(--palette-muted-teal)]",
    "bg-[var(--palette-sand)]",
    "bg-[var(--palette-dusty-rose)]",
    "bg-[var(--palette-salmon)]",
    "bg-[var(--palette-charcoal)]/30",
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (totalsRef.current && !totalsRef.current.contains(e.target as Node)) {
        setShowTotalsDropdown(false);
      }
    }
    if (showTotalsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTotalsDropdown]);

  if (yachts.length === 0) {
    return (
      <div className="mt-6 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-6 text-center text-[var(--apple-text-tertiary)]">
        No yachts available. Add a yacht first to track expenses.
      </div>
    );
  }

  return (
    <div className="mt-6 flex w-full min-w-0 flex-1 min-h-0 flex-col">
      <div className="mb-4 shrink-0 space-y-4">
        {(title || subtitle || effectiveYachtId) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title && (
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">{subtitle}</p>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <div className="mb-2 text-sm font-medium text-[var(--apple-text-secondary)]">Select yacht</div>
              <div className="flex flex-wrap gap-2">
                {yachts.map((y) => (
                  <button
                    key={y.id}
                    type="button"
                    onClick={() => selectYacht(y.id)}
                    className={`rounded-[var(--apple-radius)] border px-4 py-2 text-sm font-medium transition-colors ${
                      effectiveYachtId === y.id
                        ? "border-[var(--apple-accent)] bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]"
                        : "border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
                    }`}
                  >
                    {y.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-w-[200px] max-w-full">
              <div className="mb-2 text-sm font-medium text-[var(--apple-text-secondary)]">Time period</div>
              <CustomSelect
                value={period}
                onChange={(v) => setPeriod(normalizePeriod(v))}
                placeholder="All time"
                options={PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                emphasizeValue
              />
              {period === "custom" ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--apple-text-tertiary)]">From</label>
                    <input
                      type="datetime-local"
                      value={fromParam ?? defaultCustomRange().from}
                      onChange={(e) => setCustomRange(e.target.value, toParam ?? defaultCustomRange().to)}
                      className="apple-input w-full px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--apple-text-tertiary)]">To</label>
                    <input
                      type="datetime-local"
                      value={toParam ?? defaultCustomRange().to}
                      onChange={(e) => setCustomRange(fromParam ?? defaultCustomRange().from, e.target.value)}
                      className="apple-input w-full px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          {effectiveYachtId && (
            <div className="relative" ref={totalsRef}>
              <button
                type="button"
                onClick={() => setShowTotalsDropdown(!showTotalsDropdown)}
                className="inline-flex items-center gap-1.5 rounded-[var(--apple-radius)] border border-[var(--apple-border-strong)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--apple-text-primary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-bg-subtle)]"
              >
                Totals for {yachts.find((y) => y.id === effectiveYachtId)?.name ?? "yacht"}
                <svg className={`h-4 w-4 text-[var(--apple-text-tertiary)] transition-transform ${showTotalsDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTotalsDropdown && (
                <div className="apple-dropdown-panel absolute right-0 top-full z-10 mt-1 min-w-[260px] bg-[var(--apple-bg-elevated)] py-4 px-5 shadow-xl" style={{ boxShadow: "var(--apple-shadow-dropdown)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)] mb-3">
                    Totals for {yachts.find((y) => y.id === effectiveYachtId)?.name ?? "yacht"}
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-6">
                      <dt className="text-[var(--apple-text-secondary)]">Total Logs</dt>
                      <dd className="tabular-nums font-medium text-[var(--apple-text-primary)]">{totalLogs}</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt className="text-[var(--apple-text-secondary)]">Total Pending Logs</dt>
                      <dd className="tabular-nums font-medium text-[var(--apple-text-primary)]">{pendingLogs}</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt className="text-[var(--apple-text-secondary)]">Total Cost</dt>
                      <dd className="tabular-nums font-medium text-[var(--apple-text-primary)]">{formatUsd(totalCost)}</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt className="text-[var(--apple-text-secondary)]">Total Pending Cost</dt>
                      <dd className="tabular-nums font-medium text-[var(--apple-text-primary)]">{formatUsd(pendingCost)}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>

        {effectiveYachtId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-4 py-3 shadow-[var(--apple-shadow-sm)]">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--apple-accent-hover)]"
            >
              <PlusIcon className="h-4 w-4 shrink-0" aria-hidden />
              + Add Expense
            </button>
            <ExpenseLogsPdfExportButton
              yachtName={yachts.find((y) => y.id === effectiveYachtId)?.name ?? "Yacht"}
              periodLabel={periodLabel}
              logs={filteredLogs}
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : effectiveYachtId ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 lg:max-w-[280px]">
            <div className="rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-5 shadow-[var(--apple-shadow-sm)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">
                Expenses during this period
              </p>
              <div className="mt-4 flex h-28 items-end justify-between gap-1.5 border-b border-[var(--apple-border-muted)] pb-1">
                {chartBars.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[var(--apple-text-tertiary)]">
                    No data in this period
                  </div>
                ) : (
                  chartBars.map((b, i) => (
                    <div
                      key={b.key}
                      className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                      title={`${b.title}: ${formatUsd(b.amount)}`}
                    >
                      <div
                        className={`w-full max-w-[2rem] rounded-t-sm ${barColors[i % barColors.length]} opacity-90`}
                        style={{ height: `${Math.max(0.35, (b.pct / 100) * 5.25)}rem` }}
                      />
                    </div>
                  ))
                )}
              </div>
              <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-[var(--apple-text-primary)]">
                {formatUsd(totalCost)}
              </p>
              <p className="mt-1 text-xs text-[var(--apple-text-tertiary)]">
                {totalLogs} line{totalLogs === 1 ? "" : "s"} · {pendingLogs} open
              </p>
            </div>
          </aside>
          <div className="min-w-0 flex-1 overflow-auto">
            <ExpenseLogTable
              yachtId={effectiveYachtId}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              logs={filteredLogs}
              pending={pending}
              startTransition={startTransition}
              users={users}
              canCreateTask={canCreateTask}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function ExpenseLogAddRow({
  formId,
  onCancel,
  createTask,
  setCreateTask,
  canCreateTask,
  users,
  zebra,
}: {
  formId: string;
  onCancel: () => void;
  createTask: boolean;
  setCreateTask: (v: boolean) => void;
  canCreateTask: boolean;
  users: User[];
  zebra: boolean;
}) {
  return (
    <>
      <tr
        className={`border-b border-[var(--apple-border)] transition-colors ${
          zebra ? "bg-[var(--apple-bg-subtle)]/60" : "bg-[var(--apple-bg-elevated)]"
        }`}
      >
        <td className="w-12 px-3 py-2.5 text-left text-sm text-[var(--apple-text-tertiary)] align-middle">+</td>
        <td className="min-w-[12rem] px-3 py-2.5 text-left align-middle">
          <input
            form={formId}
            name="service"
            placeholder="e.g. Engine oil change"
            required
            className="logs-input text-left"
            autoFocus
          />
        </td>
        <td className="px-3 py-2.5 text-right align-middle">
          <div className="flex w-full min-w-0 justify-end items-center gap-0.5">
            <span className="shrink-0 text-sm text-[var(--apple-text-tertiary)]">$</span>
            <input
              form={formId}
              name="cost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="logs-input no-spinner min-w-0 max-w-[7.5rem] flex-1 text-right tabular-nums"
            />
          </div>
        </td>
        <td className="min-w-[7.5rem] px-3 py-2.5 text-left align-middle">
          <input
            form={formId}
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="logs-input text-left"
          />
        </td>
        <td className="min-w-[10rem] px-3 py-2.5 text-left align-middle">
          <input
            form={formId}
            name="comments"
            placeholder="Optional"
            className="logs-input text-left"
          />
        </td>
        <td className="px-2 py-2.5 text-center align-middle">
          <span className="text-xs text-[var(--apple-text-tertiary)]">New</span>
        </td>
        <td className="min-w-[7.5rem] px-2 py-2.5 text-right align-middle">
          <div className="flex items-center justify-end gap-1.5">
            {canCreateTask && (
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--apple-text-secondary)]">
                <input
                  form={formId}
                  type="checkbox"
                  name="createTask"
                  checked={createTask}
                  onChange={(e) => setCreateTask(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[var(--apple-border-strong)] text-[var(--apple-accent)] focus:ring-[var(--apple-accent)]"
                />
                <span>Task?</span>
              </label>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded p-1.5 text-[var(--apple-text-tertiary)] hover:bg-[var(--apple-bg-subtle)] transition-colors"
              title="Cancel"
            >
              <XIcon className="h-4 w-4" />
            </button>
            <button
              form={formId}
              type="submit"
              className="rounded p-1.5 text-[var(--palette-success-dark)] hover:bg-[var(--ocean-success-muted)] transition-colors"
              title="Save"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {canCreateTask && createTask && (
        <tr className={`border-b border-[var(--apple-border)] ${zebra ? "bg-[var(--apple-bg-subtle)]/60" : "bg-[var(--apple-bg-elevated)]"}`}>
          <td colSpan={7} className="px-4 py-2 align-middle">
            <div className="flex flex-wrap items-end gap-3 pl-2">
              <div className="min-w-[120px]">
                <label className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">Priority</label>
                <CustomSelect
                  form={formId}
                  name="priority"
                  defaultValue="MEDIUM"
                  options={PRIORITIES.map((p) => ({ value: p, label: p.replaceAll("_", " ") }))}
                />
              </div>
              <div className="min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">Assign to</label>
                <CustomSelect
                  form={formId}
                  name="assignedToUserId"
                  defaultValue=""
                  placeholder="Unassigned"
                  options={[
                    { value: "", label: "Unassigned" },
                    ...users.map((u) => ({ value: u.id, label: u.name })),
                  ]}
                />
              </div>
              <p className="text-xs text-[var(--apple-text-tertiary)]">
                Task created from this log (service as title, date as due)
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ExpenseLogTable({
  yachtId,
  showAddForm,
  setShowAddForm,
  logs,
  pending,
  startTransition,
  users,
  canCreateTask,
}: {
  yachtId: string;
  showAddForm: boolean;
  setShowAddForm: Dispatch<SetStateAction<boolean>>;
  logs: ExpenseLog[];
  pending: boolean;
  startTransition: (fn: () => void) => void;
  users: User[];
  canCreateTask: boolean;
}) {
  const router = useRouter();
  const [createTask, setCreateTask] = useState(false);
  const [addRowKey, setAddRowKey] = useState(0);
  const addFormRef = useRef<HTMLFormElement>(null);

  async function handleAdd(formData: FormData) {
    const res = await createExpenseLog(yachtId, formData);
    if (!res?.error) {
      setCreateTask(false);
      setShowAddForm(false);
      setAddRowKey((k) => k + 1);
      startTransition(() => router.refresh());
      addFormRef.current?.reset();
    } else {
      alert(res.error);
    }
  }

  async function handleEdit(id: string, formData: FormData) {
    const res = await updateExpenseLog(id, formData);
    if (!res?.error) {
      startTransition(() => router.refresh());
    } else {
      alert(res.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense entry?")) return;
    const res = await deleteExpenseLog(id);
    if (!res?.error) startTransition(() => router.refresh());
    else alert(res.error);
  }

  async function handleStatusChange(id: string, status: ExpenseLogStatus) {
    const res = await updateExpenseLogStatus(id, status);
    if (!res?.error) startTransition(() => router.refresh());
  }

  return (
    <div className="flex w-full min-w-0 flex-1 min-h-0 flex-col">
      <form
        ref={addFormRef}
        id="expense-add-form"
        action={handleAdd}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      <div className="flex w-full min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)] min-w-0">
        <div className="logs-table-scroll min-h-0 min-w-0 w-full flex-1 overflow-x-auto overflow-y-auto flex flex-col">
          <table className="w-full min-w-[1040px] table-fixed border-collapse text-sm shrink-0">
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]">
                <th className="w-12 align-middle px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">No.</th>
                <th className="align-middle px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Service</th>
                <th className="align-middle px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Cost</th>
                <th className="align-middle px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Date</th>
                <th className="align-middle px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Comments</th>
                <th className="align-middle px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Status</th>
                <th className="align-middle px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
            {(() => {
              const grouped = new Map<string, typeof logs>();
              for (const log of logs) {
                const key = getMonthKey(log.date);
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(log);
              }
              const months = Array.from(grouped.entries()).sort(([a], [b]) => b.localeCompare(a));
              const sortedGroups = months.map(([monthKey, monthLogs]) => ({
                monthKey,
                sorted: [...monthLogs].sort(
                  (a, b) => parseLogDate(a.date).getTime() - parseLogDate(b.date).getTime(),
                ),
              }));
              const newRow = (
                <Fragment key={`new-expense-${addRowKey}`}>
                  <tr className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]">
                    <td colSpan={7} className="align-middle px-4 py-2 text-left text-sm font-semibold text-[var(--apple-text-primary)]">
                      New expense
                    </td>
                  </tr>
                  <ExpenseLogAddRow
                    formId="expense-add-form"
                    onCancel={() => {
                      setShowAddForm(false);
                      setCreateTask(false);
                      addFormRef.current?.reset();
                      setAddRowKey((k) => k + 1);
                    }}
                    createTask={createTask}
                    setCreateTask={setCreateTask}
                    canCreateTask={canCreateTask}
                    users={users}
                    zebra={false}
                  />
                </Fragment>
              );
              const monthRows = sortedGroups.flatMap((group, gi) => {
                const logsBefore = sortedGroups
                  .slice(0, gi)
                  .reduce((n, g) => n + g.sorted.length, 0);
                return [
                  <tr key={`h-${group.monthKey}`} className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]">
                    <td colSpan={7} className="align-middle px-4 py-2 text-left text-sm font-semibold text-[var(--apple-text-primary)]">
                      {formatMonthHeader(group.sorted[0]!.date)}
                    </td>
                  </tr>,
                  ...group.sorted.map((log, i) => {
                    const rowIndex = logsBefore + i + 1;
                    const isEven = rowIndex % 2 === 0;
                    return (
                      <ExpenseLogRow
                        key={log.id}
                        log={log}
                        index={rowIndex}
                        zebra={isEven}
                        yachtId={yachtId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        canCreateTask={canCreateTask}
                        users={users}
                      />
                    );
                  }),
                ];
              });
              return [...(showAddForm ? [newRow] : []), ...monthRows];
            })()}
          </tbody>
        </table>
          {/* Spacer pushes Totals to bottom when there are few rows */}
          <div className="min-h-0 flex-1" aria-hidden />
          <table className="sticky bottom-0 z-10 w-full min-w-[1040px] table-fixed border-collapse text-sm shrink-0">
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <tfoot>
              <tr className="border-t-2 border-[var(--apple-border-strong)] bg-[var(--apple-bg-subtle)] font-semibold shadow-[0_-2px_8px_rgba(25,37,60,0.08)]">
                <td className="align-middle px-4 py-3.5 text-left text-[var(--apple-text-primary)]">Total</td>
                <td className="align-middle px-4 py-3.5 text-left text-[var(--apple-text-primary)]">
                  {logs.length} {logs.length === 1 ? "item" : "items"}
                </td>
                <td className="align-middle px-4 py-3.5 text-right tabular-nums text-[var(--apple-text-primary)]">
                  {formatUsd(logs.reduce((sum, l) => sum + getCostNum(l), 0))}
                </td>
                <td colSpan={4} className="align-middle" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {logs.length === 0 && !pending && !showAddForm && (
        <div className="p-6 text-center text-[var(--apple-text-tertiary)]">
          No saved expense lines yet. Use <strong className="text-[var(--apple-text-secondary)]">+ Add expense</strong> in the bar above (next to Export).
        </div>
      )}
    </div>
  );
}

function ExpenseLogRow({
  log,
  index,
  zebra,
  yachtId,
  onEdit,
  onDelete,
  onStatusChange,
  canCreateTask,
  users,
}: {
  log: ExpenseLog & { status?: string; isDone?: boolean };
  index: number;
  zebra: boolean;
  yachtId: string;
  onEdit: (id: string, formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: ExpenseLogStatus) => Promise<void>;
  canCreateTask: boolean;
  users: User[];
}) {
  const cost = typeof log.cost === "object" && log.cost !== null && "toNumber" in log.cost
    ? (log.cost as any).toNumber?.() ?? Number(log.cost)
    : Number(log.cost);
  const currentStatus: ExpenseLogStatus =
    (log.status as ExpenseLogStatus) ?? (log.isDone ? "PAID" : "PENDING_APPROVAL");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [createTask, setCreateTask] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const statusRef = useRef<HTMLDivElement>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);

  async function handleSave() {
    const row = rowRef.current;
    if (!row) return;
    const service = row.querySelector<HTMLInputElement>('input[name="service"]');
    const costInput = row.querySelector<HTMLInputElement>('input[name="cost"]');
    const dateInput = row.querySelector<HTMLInputElement>('input[name="date"]');
    const commentsInput = row.querySelector<HTMLInputElement>('input[name="comments"]');
    const createTaskCheck = row.querySelector<HTMLInputElement>('input[name="createTask"]');
    const taskRow = row.nextElementSibling;
    const priorityInput = taskRow?.querySelector<HTMLInputElement>('input[name="priority"]');
    const assignInput = taskRow?.querySelector<HTMLInputElement>('input[name="assignedToUserId"]');
    if (!service?.value?.trim()) return;
    const fd = new FormData();
    fd.set("service", service.value.trim());
    fd.set("cost", costInput?.value ?? "0");
    fd.set("date", dateInput?.value ?? "");
    fd.set("comments", commentsInput?.value ?? "");
    if (createTaskCheck?.checked) {
      fd.set("createTask", "true");
      fd.set("priority", priorityInput?.value ?? "MEDIUM");
      fd.set("assignedToUserId", assignInput?.value ?? "");
    }
    await onEdit(log.id, fd);
    setIsEditing(false);
    setCreateTask(false);
  }

  useLayoutEffect(() => {
    if (showStatusDropdown && statusButtonRef.current) {
      const rect = statusButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [showStatusDropdown]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideButton = statusRef.current?.contains(target);
      const insideDropdown = document.getElementById(`status-dropdown-${log.id}`)?.contains(target);
      if (!insideButton && !insideDropdown) {
        setShowStatusDropdown(false);
      }
    }
    function handleScroll() {
      setShowStatusDropdown(false);
    }
    if (showStatusDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [showStatusDropdown, log.id]);

  const STATUS_LABELS: Record<ExpenseLogStatus, string> = {
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    PAID: "Paid",
  };
  const statusStyles = {
    PENDING_APPROVAL: "bg-[var(--apple-bg-subtle)] text-[var(--apple-text-secondary)]",
    APPROVED: "bg-[rgba(246,227,184,0.65)] text-[#6b5420]",
    PAID: "bg-[var(--ocean-success-muted)] text-[#2d7a55]",
  };

  return (
    <>
    <tr
      ref={rowRef}
      className={`border-b border-[var(--apple-border)] transition-colors ${isEditing ? "bg-[var(--apple-accent-muted)]/30" : ""} ${zebra && !isEditing ? "bg-[var(--apple-bg-subtle)]/60" : !isEditing ? "bg-[var(--apple-bg-elevated)]" : ""} ${!isEditing ? "hover:bg-[var(--apple-bg-subtle)]" : ""}`}
    >
      <td className="w-12 px-3 py-2.5 text-left text-sm tabular-nums text-[var(--apple-text-tertiary)] align-middle">{index}</td>
      <td className="min-w-0 px-3 py-2.5 text-left align-middle">
        {isEditing ? (
          <input
            name="service"
            defaultValue={log.service}
            required
            className="logs-input text-left"
            autoFocus
          />
        ) : (
          <span className="block break-words font-medium leading-snug text-[var(--apple-text-primary)]">{log.service}</span>
        )}
      </td>
      <td className="min-w-0 px-3 py-2.5 text-right align-middle">
        {isEditing ? (
          <div className="flex w-full min-w-0 justify-end items-center gap-0.5">
            <span className="shrink-0 text-sm text-[var(--apple-text-tertiary)]">$</span>
            <input
              name="cost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={formatCostPlain(cost)}
              className="logs-input no-spinner min-w-0 max-w-[7.5rem] flex-1 text-right tabular-nums"
            />
          </div>
        ) : (
          <span className="inline-block whitespace-nowrap tabular-nums text-[var(--apple-text-primary)]">{formatUsd(cost)}</span>
        )}
      </td>
      <td className="min-w-0 px-3 py-2.5 text-left align-middle">
        {isEditing ? (
          <input
            name="date"
            type="date"
            required
            defaultValue={toDateInputValue(log.date)}
            className="logs-input text-left"
          />
        ) : (
          <span className="whitespace-nowrap text-[var(--apple-text-secondary)]">{formatDateDDMMYY(log.date)}</span>
        )}
      </td>
      <td className="min-w-0 px-3 py-2.5 text-left align-middle">
        {isEditing ? (
          <input
            name="comments"
            defaultValue={log.comments ?? ""}
            className="logs-input text-left"
          />
        ) : (
          <span className="block break-words leading-snug text-[var(--apple-text-tertiary)]" title={log.comments ?? undefined}>
            {log.comments ?? "—"}
          </span>
        )}
      </td>
      <td className="min-w-0 px-2 py-2.5 text-center align-middle">
        {isEditing ? (
          <span className="text-xs text-[var(--apple-text-tertiary)]">—</span>
        ) : (
          <div className="relative flex justify-center" ref={statusRef}>
            <button
              ref={statusButtonRef}
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`inline-flex max-w-full min-w-0 shrink items-center justify-center gap-1.5 whitespace-normal rounded px-2 py-1.5 text-center text-xs font-medium leading-tight transition-colors ${statusStyles[currentStatus]} hover:opacity-90`}
            >
              {STATUS_LABELS[currentStatus]}
              <svg className={`h-3.5 w-3.5 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showStatusDropdown && typeof document !== "undefined" && createPortal(
              <div
                id={`status-dropdown-${log.id}`}
                className="apple-dropdown-panel fixed z-[100] min-w-[120px] w-max bg-[var(--apple-bg-elevated)] px-1 py-2 shadow-xl"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  boxShadow: "var(--apple-shadow-dropdown)",
                }}
              >
                {(["PENDING_APPROVAL", "APPROVED", "PAID"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onStatusChange(log.id, s);
                      setShowStatusDropdown(false);
                    }}
                    className={`block w-full whitespace-nowrap rounded px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--apple-bg-subtle)] ${currentStatus === s ? "font-medium text-[var(--apple-accent)]" : "text-[var(--apple-text-primary)]"}`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
        )}
      </td>
      <td className="min-w-0 px-2 py-2.5 text-right align-middle">
        <div className="flex flex-wrap items-center justify-end gap-1">
          {isEditing ? (
            <>
              {canCreateTask && (
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--apple-text-secondary)]">
                  <input
                    type="checkbox"
                    name="createTask"
                    checked={createTask}
                    onChange={(e) => setCreateTask(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[var(--apple-border-strong)] text-[var(--apple-accent)] focus:ring-[var(--apple-accent)]"
                  />
                  <span>Task?</span>
                </label>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCreateTask(false);
                }}
                className="rounded p-1.5 text-[var(--apple-text-tertiary)] hover:bg-[var(--apple-bg-subtle)] transition-colors"
                title="Cancel"
              >
                <XIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded p-1.5 text-[var(--palette-success-dark)] hover:bg-[var(--ocean-success-muted)] transition-colors"
                title="Save"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded p-1.5 text-[var(--apple-text-tertiary)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)] transition-colors"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(log.id)}
              className="rounded p-1.5 text-[var(--apple-text-tertiary)] hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            </>
          )}
        </div>
      </td>
    </tr>
    {isEditing && canCreateTask && createTask && (
      <tr className={`border-b border-[var(--apple-border)] ${zebra ? "bg-[var(--apple-bg-subtle)]/60" : "bg-[var(--apple-bg-elevated)]"}`}>
        <td colSpan={7} className="px-4 py-2 align-middle">
          <div className="flex flex-wrap items-end gap-3 pl-2">
            <div className="min-w-[120px]">
              <label className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">Priority</label>
              <CustomSelect
                name="priority"
                defaultValue="MEDIUM"
                options={PRIORITIES.map((p) => ({ value: p, label: p.replaceAll("_", " ") }))}
              />
            </div>
            <div className="min-w-[140px]">
              <label className="mb-1 block text-xs font-medium text-[var(--apple-text-secondary)]">Assign to</label>
              <CustomSelect
                name="assignedToUserId"
                defaultValue=""
                placeholder="Unassigned"
                options={[
                  { value: "", label: "Unassigned" },
                  ...users.map((u) => ({ value: u.id, label: u.name })),
                ]}
              />
            </div>
            <p className="text-xs text-[var(--apple-text-tertiary)]">
              Task created from this log (service as title, date as due)
            </p>
          </div>
        </td>
      </tr>
    )}
    </>
  );
}

