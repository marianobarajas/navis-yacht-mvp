"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";

type Yacht = { id: string; name: string };
type User = { id: string; name: string };

export function TasksFilters({
  yachts,
  technicians,
  current,
}: {
  yachts: Yacht[];
  technicians: User[];
  current: { status?: string; statusGroup?: string; priority?: string; yachtId?: string; assignee?: string; due?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/tasks?${params.toString()}`);
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <CustomSelect
        value={current.statusGroup ?? ""}
        onChange={(v) => update("statusGroup", v)}
        placeholder="All statuses"
        className="min-w-[160px]"
        options={[
          { value: "", label: "All statuses" },
          { value: "todo", label: "To do" },
          { value: "in_progress", label: "In progress" },
          { value: "done", label: "Done" },
        ]}
      />
      <CustomSelect
        value={current.priority ?? ""}
        onChange={(v) => update("priority", v)}
        placeholder="All priorities"
        className="min-w-[160px]"
        options={[
          { value: "", label: "All priorities" },
          { value: "LOW", label: "Low" },
          { value: "MEDIUM", label: "Medium" },
          { value: "HIGH", label: "High" },
          { value: "CRITICAL", label: "Critical" },
        ]}
      />
      <CustomSelect
        value={current.due ?? ""}
        onChange={(v) => update("due", v)}
        placeholder="Due: All"
        className="min-w-[160px]"
        options={[
          { value: "", label: "Due: All" },
          { value: "overdue", label: "Overdue" },
          { value: "upcoming", label: "Due in 5 days" },
        ]}
      />
      {yachts.length > 0 && (
        <CustomSelect
          value={current.yachtId ?? ""}
          onChange={(v) => update("yachtId", v)}
          placeholder="All yachts"
          className="min-w-[160px]"
          options={[
            { value: "", label: "All yachts" },
            ...yachts.map((y) => ({ value: y.id, label: y.name })),
          ]}
        />
      )}
      {technicians.length > 0 && (
        <CustomSelect
          value={current.assignee ?? ""}
          onChange={(v) => update("assignee", v)}
          placeholder="All assignees"
          className="min-w-[160px]"
          options={[
            { value: "", label: "All assignees" },
            ...technicians.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
      )}
    </div>
  );
}
