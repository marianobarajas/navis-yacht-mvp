"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./rbc-calendar.css";

import {
  EventEditPanel,
  type CalendarEventUI,
  type YachtLite,
  type UserLite,
} from "./EventEditPanel";

import { createCalendarEvent } from "@/actions/calendar";
import { formatDateDDMMYY, parseMMDDYYYY, toDateInputValue } from "@/lib/dateUtils";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { CheckIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "@/components/ui/Icons";
import { Navigate } from "react-big-calendar";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type CalendarEventLite = {
  id: string;
  title: string;
  startAt: string | Date;
  endAt?: string | Date | null;
  yachtId?: string | null;
  assignedUserId?: string | null;
};

type TaskLite = {
  id: string;
  title: string;
  startDate: Date | null;
  dueDate: Date | null;
  status: string;
  priority: string;
  yachtId: string;
  assignedToUserId?: string | null;
};

type RbcEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  /** Date-only events use exclusive end (first instant after last day); requires allDay so RBC does not treat span as timed. */
  allDay?: boolean;
  resource?: {
    type: "event" | "task";
    eventId?: string;
    taskId?: string;
    yachtId?: string | null;
    assignedUserId?: string | null;
    _startAtISO: string;
    _endAtISO: string | null;
  };
};

function toISODate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function CalendarView({
  initialEvents,
  initialTasks,
  yachts,
  users,
  canCreate,
  canCreateTask,
  initialDate,
}: {
  initialEvents: CalendarEventLite[];
  initialTasks: TaskLite[];
  yachts: YachtLite[];
  users: UserLite[];
  canCreate: boolean;
  canCreateTask: boolean;
  initialDate?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [openCreate, setOpenCreate] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  /** End date as MM/DD/YYYY text (same convention as Start) — not browser locale. */
  const [endDateText, setEndDateText] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createTask, setCreateTask] = useState(false);
  const [selected, setSelected] = useState<CalendarEventUI | null>(null);
  const [date, setDate] = useState(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const events: RbcEvent[] = useMemo(() => {
    const eventItems: RbcEvent[] = (initialEvents ?? []).map((e) => {
      const startRaw =
        typeof e.startAt === "string" ? new Date(e.startAt) : e.startAt;
      const endRaw =
        e.endAt == null
          ? null
          : typeof e.endAt === "string"
            ? new Date(e.endAt)
            : e.endAt;
      const start = startOfDay(startRaw);
      const lastDayInclusive = endRaw ? startOfDay(endRaw) : start;
      const end = addDays(lastDayInclusive, 1);

      return {
        id: `event-${e.id}`,
        title: e.title,
        start,
        end,
        allDay: true,
        resource: {
          type: "event",
          eventId: e.id,
          yachtId: e.yachtId ?? null,
          assignedUserId: e.assignedUserId ?? null,
          _startAtISO: startRaw.toISOString(),
          _endAtISO: endRaw ? endRaw.toISOString() : null,
        },
      };
    });

    const taskItems: RbcEvent[] = (initialTasks ?? [])
      .filter((t) => t.startDate || t.dueDate)
      .map((t) => {
        const startRaw = t.startDate
          ? typeof t.startDate === "string"
            ? new Date(t.startDate)
            : t.startDate
          : typeof t.dueDate === "string"
            ? new Date(t.dueDate!)
            : t.dueDate!;
        const endRaw = t.dueDate
          ? typeof t.dueDate === "string"
            ? new Date(t.dueDate)
            : t.dueDate
          : startRaw;

        const start = startOfDay(startRaw);
        const lastDayInclusive = startOfDay(endRaw);
        const end = addDays(lastDayInclusive, 1);

        return {
          id: `task-${t.id}`,
          title: t.title,
          start,
          end,
          allDay: true,
          resource: {
            type: "task",
            taskId: t.id,
            _startAtISO: startRaw.toISOString(),
            _endAtISO: endRaw.toISOString(),
          },
        };
      });

    return [...eventItems, ...taskItems];
  }, [initialEvents, initialTasks]);

  function onSelectSlot({ start }: { start: Date }) {
    if (!canCreate) return;
    setCreateError(null);
    setPickedDate(start);
    setOpenCreate(true);
  }

  useEffect(() => {
    if (openCreate && pickedDate) {
      setEndDateText(formatDateDDMMYY(pickedDate));
    }
  }, [openCreate, pickedDate]);

  function closeCreate() {
    setOpenCreate(false);
    setPickedDate(null);
    setEndDateText("");
    setCreateError(null);
    setCreateTask(false);
  }

  function onSubmitCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);

    if (!pickedDate) {
      setCreateError("Missing start date");
      return;
    }

    const fd = new FormData(e.currentTarget);

    fd.set("startAt", toISODate(pickedDate));

    const endTrim = endDateText.trim();
    if (!endTrim) {
      fd.set("endAt", toISODate(pickedDate));
    } else {
      const endParsed = parseMMDDYYYY(endTrim);
      if (!endParsed) {
        setCreateError("End date must be MM/DD/YYYY (e.g. 03/25/2026).");
        return;
      }
      const startMid = new Date(pickedDate);
      startMid.setHours(0, 0, 0, 0);
      const endMid = new Date(endParsed);
      endMid.setHours(0, 0, 0, 0);
      if (endMid < startMid) {
        setCreateError("End date must be on or after the start date.");
        return;
      }
      fd.set("endAt", toDateInputValue(endParsed));
    }

    startTransition(async () => {
      const res = await createCalendarEvent(fd);
      if ((res as any)?.error) {
        setCreateError((res as any).error);
        return;
      }
      closeCreate();
      router.refresh();
    });
  }

  function onSelectEvent(ev: RbcEvent) {
    const res = ev.resource;
    if (!res) return;

    if (res.type === "task" && res.taskId) {
      router.push(`/tasks/${res.taskId}`);
      return;
    }

    if (!canCreate) return;

    const startAt = res._startAtISO ? new Date(res._startAtISO) : ev.start;
    const endAt = res._endAtISO ? new Date(res._endAtISO) : null;
    const yachtId = res.yachtId ?? null;
    const assignedUserId = res.assignedUserId ?? null;
    const yacht = yachtId ? yachts.find((y) => y.id === yachtId) ?? null : null;
    const assignedTo =
      assignedUserId ? users.find((u) => u.id === assignedUserId) ?? null : null;

    setSelected({
      id: res.eventId ?? ev.id,
      title: ev.title ?? "",
      startAt,
      endAt,
      yachtId,
      assignedUserId,
      yacht,
      assignedTo,
    });
  }

  const eventPropGetter = (event: RbcEvent) => {
    const isTask = event.resource?.type === "task";
    return {
      className: isTask ? "rbc-event--task" : "rbc-event--event",
    };
  };

  function CalendarToolbar(toolbarProps: {
    label: string;
    onNavigate: (action: import("react-big-calendar").NavigateAction, date?: Date) => void;
  }) {
    const { label, onNavigate } = toolbarProps as {
      label: string;
      onNavigate: (action: import("react-big-calendar").NavigateAction, date?: Date) => void;
    };
    return (
      <div className="rbc-toolbar rbc-toolbar-custom">
        <span className="rbc-btn-group rbc-btn-group-left">
          <button type="button" onClick={() => onNavigate(Navigate.TODAY)} aria-label="Today" className="rbc-btn rbc-btn-icon">
            <CalendarIcon className="h-4 w-4" />
          </button>
          <span className="rbc-toolbar-divider" aria-hidden />
          <span className="rbc-btn-group">
            <button type="button" onClick={() => onNavigate(Navigate.PREVIOUS)} aria-label="Previous month" className="rbc-btn rbc-btn-icon">
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onNavigate(Navigate.NEXT)} aria-label="Next month" className="rbc-btn rbc-btn-icon">
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </span>
        </span>
        <span className="rbc-toolbar-label">{label}</span>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {canCreate ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setPickedDate(date);
              setOpenCreate(true);
            }}
            className="inline-flex items-center gap-2 rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--apple-accent-hover)]"
          >
            + Add Event
          </button>
        </div>
      ) : null}
      <div className="rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-6 shadow-[var(--apple-shadow-sm)]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          defaultView="month"
          views={["month"]}
          onSelectSlot={onSelectSlot}
          onSelectEvent={onSelectEvent}
          selectable={canCreate}
          showAllEvents
          eventPropGetter={eventPropGetter}
          components={{ toolbar: CalendarToolbar }}
          style={{ minHeight: 640 }}
        />
      </div>

      <EventEditPanel
        event={selected}
        yachts={yachts}
        users={users}
        onClose={() => setSelected(null)}
      />

      {openCreate ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCreate} />
          <div
            className="relative my-auto flex w-full max-w-lg max-h-[min(92dvh,56rem)] flex-col overflow-hidden rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-xl)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--apple-border)] px-5 py-4">
              <div>
                <div className="text-base font-semibold text-[var(--apple-text-primary)]">
                  Create event
                </div>
                <div className="mt-0.5 text-sm text-[var(--apple-text-tertiary)]">
                  {pickedDate ? formatDateDDMMYY(pickedDate) : "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeCreate}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmitCreate} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
                  Start date
                </label>
                <div className="apple-input flex w-full items-center px-3 py-2 text-sm font-normal text-[var(--apple-text-primary)]">
                  {pickedDate ? formatDateDDMMYY(pickedDate) : "—"}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
                  End date
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="MM/DD/YYYY"
                  value={endDateText}
                  onChange={(e) => setEndDateText(e.target.value)}
                  className="apple-input w-full px-3 py-2 text-sm font-normal text-[var(--apple-text-primary)] [font-family:inherit]"
                  aria-describedby="create-event-end-hint"
                />
                <div id="create-event-end-hint" className="text-xs text-[var(--apple-text-tertiary)]">
                  Same format as start date (MM/DD/YYYY). Leave blank to use the start date only.
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
                  Title
                </label>
                <input
                  name="title"
                  required
                  className="apple-input w-full px-3 py-2 text-sm"
                  placeholder="e.g. Engine inspection"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
                  Yacht {createTask ? "(required for task)" : "(optional)"}
                </label>
                <CustomSelect
                  name="yachtId"
                  defaultValue=""
                  required={createTask}
                  placeholder="No yacht"
                  options={[
                    { value: "", label: "No yacht" },
                    ...yachts.map((y) => ({ value: y.id, label: y.name })),
                  ]}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
                  Assign to (optional)
                </label>
                <CustomSelect
                  name="assignedUserId"
                  defaultValue=""
                  placeholder="Unassigned"
                  options={[
                    { value: "", label: "Unassigned" },
                    ...users.map((u) => ({ value: u.id, label: u.name })),
                  ]}
                />
              </div>

              {canCreateTask ? (
                <>
                  <div className="space-y-1">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        name="createTask"
                        checked={createTask}
                        onChange={(e) => setCreateTask(e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--apple-border-strong)] text-[var(--apple-accent)] focus:ring-[var(--apple-accent)]"
                      />
                      <span className="text-sm font-medium text-[var(--apple-text-primary)]">
                        Also create a Task
                      </span>
                    </label>
                    <p className="text-xs text-[var(--apple-text-tertiary)]">
                      When checked, a task will be created. Yacht is required.
                    </p>
                  </div>

                  {createTask ? (
                    <>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
                          Priority
                        </label>
                        <CustomSelect
                          name="priority"
                          defaultValue="MEDIUM"
                          options={PRIORITIES.map((p) => ({
                            value: p,
                            label: p.replaceAll("_", " "),
                          }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
                          Description (optional)
                        </label>
                        <textarea
                          name="description"
                          rows={3}
                          className="apple-input w-full px-3 py-2 text-sm"
                          placeholder="Task details, notes…"
                        />
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}

            </div>
            </div>

            <div className="shrink-0 border-t border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-5 py-3">
              {createError ? (
                <div className="mb-3 rounded-[var(--apple-radius-sm)] bg-[var(--ocean-coral-muted)] px-3 py-2 text-sm text-[var(--accent-urgent)]">
                  {createError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreate}
                  aria-label="Cancel"
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:bg-[var(--apple-bg-subtle)]"
                >
                  <XIcon className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  aria-label={isPending ? "Saving…" : "Create"}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent)] text-white disabled:opacity-60 hover:bg-[var(--apple-accent-hover)]"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
