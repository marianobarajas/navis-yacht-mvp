"use client";

import { useMemo, useState } from "react";
import { CalendarGrid } from "./CalendarGrid";
import { EventEditPanel, type CalendarEventUI, type YachtLite, type UserLite } from "./EventEditPanel";

type ServerEvent = {
  id: string;
  title: string;
  description?: string | null;
  startAt: string | Date;
  endAt: string | Date | null;
  yachtId: string | null;
  assignedUserId: string | null;
  yacht?: { id: string; name: string } | null;
  assignedTo?: { id: string; name: string } | null;
};

export function CalendarClient({
  events,
  workOrders,
  yachts,
  users,
}: {
  events: ServerEvent[];
  workOrders: any[];
  yachts: YachtLite[];
  users: UserLite[];
}) {
  const uiEvents: CalendarEventUI[] = useMemo(() => {
    return (events ?? []).map((ev) => {
      const startAt = typeof ev.startAt === "string" ? new Date(ev.startAt) : ev.startAt;
      const endAt =
        ev.endAt
          ? typeof ev.endAt === "string"
            ? new Date(ev.endAt)
            : ev.endAt
          : null;

      const yacht =
        ev.yacht ?? (ev.yachtId ? yachts.find((y) => y.id === ev.yachtId) ?? null : null);

      const assignedTo =
        ev.assignedTo ?? (ev.assignedUserId ? users.find((u) => u.id === ev.assignedUserId) ?? null : null);

      return {
        id: ev.id,
        title: ev.title,
        description: ev.description ?? null,
        startAt,
        endAt,
        yachtId: ev.yachtId ?? null,
        assignedUserId: ev.assignedUserId ?? null,
        yacht,
        assignedTo,
      };
    });
  }, [events, yachts, users]);

  const [selected, setSelected] = useState<CalendarEventUI | null>(null);

  return (
    <>
      <CalendarGrid
        events={uiEvents}
        workOrders={workOrders}
        onEventClick={(ev: CalendarEventUI) => setSelected(ev)}
      />

      <EventEditPanel
        event={selected}
        yachts={yachts}
        users={users}
        onClose={() => setSelected(null)}
      />
    </>
  );
}