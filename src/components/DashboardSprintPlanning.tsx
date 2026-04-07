"use client";

import { useState } from "react";
import { KanbanPreview } from "./KanbanPreview";
import { CustomSelect } from "./ui/CustomSelect";
import type { WorkOrderStatus } from "@prisma/client";

type Wo = {
  id: string;
  title: string;
  status: WorkOrderStatus;
  yacht: { id: string; name: string };
  priority: string;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_PARTS", label: "Waiting Parts" },
  { value: "DONE", label: "Done" },
  { value: "CLOSED", label: "Closed" },
];

export function DashboardSprintPlanning({
  workOrders,
  inline,
  glass,
}: {
  workOrders: Wo[];
  inline?: boolean;
  glass?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState("");

  const filtered =
    statusFilter === ""
      ? workOrders
      : workOrders.filter((wo) => wo.status === statusFilter);

  const content = (
    <>
      <div className={`flex flex-wrap items-center justify-between gap-4 ${inline ? "" : "mt-4"}`}>
        {!inline && (
          <h2 className="text-xl font-semibold tracking-tight text-[var(--apple-text-primary)]">
            Sprint planning
          </h2>
        )}
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--apple-text-tertiary)]">Filter by status</span>
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All statuses"
            className="min-w-[140px]"
            options={STATUS_OPTIONS}
          />
        </div>
      </div>
      <div className="mt-4">
        <KanbanPreview workOrders={filtered} glass={glass} />
      </div>
    </>
  );

  if (inline) return content;
  return <section className="mt-10">{content}</section>;
}
