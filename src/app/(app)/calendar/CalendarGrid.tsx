"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CalendarEventUI } from "./EventEditPanel";

type WorkOrder = {
  id: string;
  title: string;
  dueDate: Date | null;
  yacht: { id: string; name: string };
};

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  const startDay = first.getDay();
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

export function CalendarGrid({
  events,
  workOrders,
  onEventClick,
}: {
  events: CalendarEventUI[];
  workOrders: WorkOrder[];
  onEventClick?: (event: CalendarEventUI) => void;
}) {
  const [date, setDate] = useState(() => new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const prevMonth = () => setDate(new Date(year, month - 1, 1));
  const nextMonth = () => setDate(new Date(year, month + 1, 1));

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEventUI[]> = {};
    for (const e of events) {
      const d = new Date(e.startAt);
      const k = dayKey(d);
      (map[k] ||= []).push(e);
    }
    return map;
  }, [events]);

  const workOrdersByDay = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    for (const wo of workOrders) {
      if (!wo.dueDate) continue;
      const d = new Date(wo.dueDate);
      const k = dayKey(d);
      (map[k] ||= []).push(wo);
    }
    return map;
  }, [workOrders]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className="overflow-hidden rounded-[var(--oceanops-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--oceanops-shadow)]">
      <div className="flex items-center justify-between border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] px-4 py-3">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg px-2 py-1 text-sm text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-muted-hover)]"
          aria-label="Previous month"
        >
          ←
        </button>

        <h2 className="font-semibold text-[var(--apple-text-primary)]">
          {date.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>

        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg px-2 py-1 text-sm text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-muted-hover)]"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 text-sm">
        {weekDays.map((w) => (
          <div
            key={w}
            className="border-b border-r border-[var(--apple-border-muted)] bg-[var(--apple-bg-subtle)] p-2 text-center text-sm font-medium text-[var(--apple-text-secondary)]"
          >
            {w}
          </div>
        ))}

        {days.map((d, i) => {
          if (!d) {
            return (
              <div
                key={`empty-${i}`}
                className="min-h-[96px] border-b border-r border-[var(--apple-border-muted)] bg-[var(--apple-bg-muted)]"
              />
            );
          }

          const k = dayKey(d);
          const dayEvents = eventsByDay[k] ?? [];
          const dayWOs = workOrdersByDay[k] ?? [];
          const todayFlag = isSameDay(d, today);

          const shownEvents = dayEvents.slice(0, 2);
          const shownWOs = dayWOs.slice(0, 2);
          const hiddenCount =
            (dayEvents.length - shownEvents.length) + (dayWOs.length - shownWOs.length);

          return (
            <div
              key={k}
              className={`min-h-[96px] border-b border-r border-[var(--apple-border-muted)] p-2 ${
                todayFlag ? "bg-[var(--ocean-teal-muted)]/50" : ""
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  todayFlag ? "text-[var(--palette-teal-dark)]" : "text-[var(--apple-text-secondary)]"
                }`}
              >
                {d.getDate()}
              </span>

              <div className="mt-1 space-y-0.5">
                {shownEvents.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onEventClick?.(e)}
                    className="block w-full truncate rounded border-l-2 border-l-[var(--palette-muted-teal)] bg-[var(--ocean-teal-muted)] px-1 pl-1.5 text-left text-xs text-[#1f6569] hover:bg-[rgba(90,143,143,0.28)]"
                    title={e.title}
                  >
                    {e.title}
                  </button>
                ))}

                {shownWOs.map((wo) => (
                  <Link
                    key={wo.id}
                    href={`/tasks/${wo.id}`}
                    className="block truncate rounded border-l-2 border-l-[#c9a43a] bg-[rgba(246,227,184,0.55)] px-1 pl-1.5 text-xs text-[#6b5420] hover:bg-[rgba(246,227,184,0.85)]"
                    title={wo.title}
                  >
                    WO: {wo.title}
                  </Link>
                ))}

                {hiddenCount > 0 ? (
                  <span className="text-xs text-[var(--apple-text-tertiary)]">+{hiddenCount}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}