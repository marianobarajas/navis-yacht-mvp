"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { priorityBorderLeftClass, priorityDotClass } from "@/lib/uiAccent";

export type CalendarPreviewDay = {
  iso: string;
  items: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string | null;
    status: string;
  }>;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Compact weekday initials (matches week-strip mockups) */
function fmtWeekdayLetter(iso: string) {
  const d = new Date(iso).getDay();
  return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d] ?? "";
}

function fmtDayNum(iso: string) {
  return String(new Date(iso).getDate());
}

function fmtToolbarDate(todayIso: string) {
  return new Date(todayIso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

function fmtListHeader(d: Date) {
  const isToday = sameDay(d, new Date());
  const dayPart = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return isToday ? `Today · ${dayPart}` : dayPart;
}

function priorityBadge(priority: string) {
  if (priority === "CRITICAL") return "MAJOR";
  if (priority === "HIGH") return "HIGH";
  return null;
}

export function DashboardCalendarPreview({
  days,
  todayIso,
  glass,
}: {
  days: CalendarPreviewDay[];
  todayIso: string;
  glass?: boolean;
}) {
  const today = useMemo(() => {
    const t = new Date(todayIso);
    t.setHours(0, 0, 0, 0);
    return t;
  }, [todayIso]);

  const [selectedIso, setSelectedIso] = useState(() => {
    const t = new Date(todayIso);
    t.setHours(0, 0, 0, 0);
    return t.toISOString();
  });

  const [overdueFilter, setOverdueFilter] = useState<"all" | "overdue">("all");
  const [scope, setScope] = useState<"today" | "week">("week");

  const selectedDate = useMemo(() => {
    const d = new Date(selectedIso);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedIso]);

  const dayList = useMemo(() => {
    return days.map((d) => {
      const dt = new Date(d.iso);
      dt.setHours(0, 0, 0, 0);
      return { ...d, date: dt };
    });
  }, [days]);

  const selectedIdx = Math.max(
    0,
    dayList.findIndex((d) => sameDay(d.date, selectedDate))
  );

  function goPrevDay() {
    if (selectedIdx <= 0) return;
    const prev = dayList[selectedIdx - 1];
    setSelectedIso(prev.iso);
  }

  function goNextDay() {
    if (selectedIdx >= dayList.length - 1) return;
    const next = dayList[selectedIdx + 1];
    setSelectedIso(next.iso);
  }

  function jumpToday() {
    const t = new Date(todayIso);
    t.setHours(0, 0, 0, 0);
    const match = dayList.find((d) => sameDay(d.date, t));
    setSelectedIso(match ? match.iso : t.toISOString());
  }

  const rawItems =
    dayList.find((d) => sameDay(d.date, selectedDate))?.items ?? [];

  const items = useMemo(() => {
    const now = new Date();
    let list = rawItems;
    if (overdueFilter === "overdue") {
      list = list.filter((it) => {
        if (!it.dueDate) return false;
        const due = new Date(it.dueDate);
        if (due >= now) return false;
        if (["DONE", "CLOSED"].includes(it.status)) return false;
        return true;
      });
    }
    return [...list].sort((a, b) => {
      const pa = a.priority === "CRITICAL" ? 0 : a.priority === "HIGH" ? 1 : 2;
      const pb = b.priority === "CRITICAL" ? 0 : b.priority === "HIGH" ? 1 : 2;
      return pa - pb;
    });
  }, [rawItems, overdueFilter]);

  const shell =
    glass === true
      ? "flex flex-col rounded-xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ease-out hover:scale-[1.015] hover:border-white/45 hover:bg-white/[0.15] hover:shadow-[0_24px_55px_-12px_rgba(0,0,0,0.52)]"
      : "flex flex-col rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-5 shadow-sm";

  const navChevronBtn =
    glass === true
      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-black/25 text-white shadow-sm transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40";

  const weekStripBorder = glass === true ? "border-white/35" : "border-[var(--apple-border)]";

  const todayBtnClass =
    glass === true
      ? "shrink-0 rounded-lg border border-white/45 bg-white/18 px-3 py-1.5 text-sm font-semibold text-white shadow-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] transition-colors hover:bg-white/28"
      : "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)]";

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--apple-text-primary)]">
          Calendar Preview
        </h2>
      </div>

      {/* Toolbar — mockup: filters + centered date */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
        <div className="flex justify-start">
          <label className="sr-only" htmlFor="cal-scope">
            View range
          </label>
          <select
            id="cal-scope"
            value={scope}
            onChange={(e) => {
              const v = e.target.value as "today" | "week";
              setScope(v);
              if (v === "today") jumpToday();
            }}
            className="apple-select max-w-[11rem] py-2 text-xs sm:text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
          </select>
        </div>
        <p className="text-center text-base font-semibold text-[var(--apple-text-primary)] sm:text-lg">
          {fmtToolbarDate(todayIso)}
        </p>
        <div className="flex justify-start sm:justify-end">
          <label className="sr-only" htmlFor="cal-overdue">
            Filter tasks
          </label>
          <select
            id="cal-overdue"
            value={overdueFilter}
            onChange={(e) => setOverdueFilter(e.target.value as "all" | "overdue")}
            className="apple-select max-w-[11rem] py-2 text-xs sm:text-sm"
          >
            <option value="all">All tasks</option>
            <option value="overdue">Show overdue</option>
          </select>
        </div>
      </div>

      {/* Week navigator */}
      <div className={`mt-4 flex items-center gap-2 border-b pb-3 ${weekStripBorder}`}>
        <button
          type="button"
          onClick={goPrevDay}
          disabled={selectedIdx <= 0}
          className={navChevronBtn}
          aria-label="Previous day"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={jumpToday}
          className={todayBtnClass}
        >
          Today
        </button>
        <div className="flex min-w-0 flex-1 justify-between gap-0.5 overflow-x-auto sm:gap-1">
          {dayList.map((d) => {
            const isSel = sameDay(d.date, selectedDate);
            const isToday = sameDay(d.date, today);
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelectedIso(d.iso)}
                className={
                  glass === true
                    ? `flex min-w-[2.25rem] flex-col items-center rounded-lg px-1 py-1.5 transition-colors sm:min-w-[2.5rem] ${
                        isSel
                          ? "bg-white/22 ring-2 ring-amber-200/90 text-white shadow-md drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                          : "hover:bg-white/10"
                      }`
                    : `flex min-w-[2.25rem] flex-col items-center rounded-lg px-1 py-1.5 transition-colors sm:min-w-[2.5rem] ${
                        isSel
                          ? "ring-2 ring-[var(--apple-accent)] ring-offset-1 ring-offset-white"
                          : "hover:bg-[var(--apple-bg-subtle)]"
                      }`
                }
              >
                <span
                  className={
                    glass === true
                      ? `text-[10px] font-medium uppercase ${isSel ? "text-white/90" : "text-white/65"}`
                      : "text-[10px] font-medium uppercase text-[var(--apple-text-tertiary)]"
                  }
                >
                  {fmtWeekdayLetter(d.iso)}
                </span>
                <span
                  className={
                    glass === true
                      ? `mt-0.5 text-sm font-bold tabular-nums ${
                          isSel ? "text-white" : isToday ? "text-amber-200" : "text-white/90"
                        }`
                      : `mt-0.5 text-sm font-bold tabular-nums ${
                          isSel
                            ? "text-[var(--apple-accent)]"
                            : isToday
                              ? "text-[var(--apple-text-primary)]"
                              : "text-[var(--apple-text-secondary)]"
                        }`
                  }
                >
                  {fmtDayNum(d.iso)}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={goNextDay}
          disabled={selectedIdx >= dayList.length - 1}
          className={navChevronBtn}
          aria-label="Next day"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Event list */}
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p
            className={
              glass === true
                ? "py-6 text-center text-sm text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                : "py-6 text-center text-sm text-[var(--apple-text-tertiary)]"
            }
          >
            No tasks for this day
            {overdueFilter === "overdue" ? " (overdue filter)" : ""}.
          </p>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--apple-text-tertiary)]">
              {fmtListHeader(selectedDate)}
              {items[0]?.dueDate ? (
                <span className="ml-2 font-normal normal-case text-[var(--apple-text-secondary)]">
                  {new Date(items[0].dueDate).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </p>
            <ul className="space-y-2">
              {items.map((it) => {
                const due = it.dueDate ? new Date(it.dueDate) : null;
                const badge = priorityBadge(it.priority);
                return (
                  <li key={it.id}>
                    <Link
                      href={`/tasks/${it.id}`}
                      className={`flex items-start gap-3 rounded-lg border border-[var(--apple-border)] border-l-4 bg-[var(--apple-bg-subtle)]/50 p-3 pl-3 transition-colors hover:bg-[var(--apple-bg-subtle)] ${priorityBorderLeftClass(it.priority)}`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDotClass(it.priority)}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {it.priority === "CRITICAL" ? (
                            <svg
                              className="h-4 w-4 shrink-0 text-[var(--accent-urgent)]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          ) : null}
                          <span className="font-medium text-[var(--apple-text-primary)]">
                            {it.title}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--apple-text-tertiary)]">
                          {due ? (
                            <span>
                              {due.toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span>All day</span>
                          )}
                          {badge ? (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                it.priority === "HIGH"
                                  ? "bg-[rgba(246,227,184,0.75)] text-[#6b5420]"
                                  : "bg-[var(--ocean-coral-muted)] text-[var(--accent-urgent)]"
                              }`}
                            >
                              {badge}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <svg
                        className="h-5 w-5 shrink-0 text-[var(--apple-text-tertiary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <Link
        href="/calendar"
        className={
          glass === true
            ? "mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-colors hover:text-white"
            : "mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--apple-text-tertiary)] hover:text-[var(--apple-accent)]"
        }
      >
        View Full Calendar
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
