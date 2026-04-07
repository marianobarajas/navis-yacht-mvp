"use client";

import { useRouter } from "next/navigation";
import { PriorityBadge } from "@/components/ui/Badge";
import { EditableStatusCell } from "./EditableStatusCell";
import { formatDateDDMMYY } from "@/lib/dateUtils";
import { priorityBorderLeftClass } from "@/lib/uiAccent";

export function TaskTableRow({ wo }: { wo: any }) {
  const router = useRouter();

  function handleRowClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-row-nav]")) return;
    router.push(`/tasks/${wo.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-row-nav]")) return;
    e.preventDefault();
    router.push(`/tasks/${wo.id}`);
  }

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      className="border-b border-[var(--apple-border)] cursor-pointer transition-colors hover:bg-[var(--apple-bg-subtle)]"
    >
      <td
        className={`border-l-4 px-4 py-3 ${priorityBorderLeftClass(wo.priority)}`}
      >
        <span className="font-medium text-[var(--apple-text-primary)]">
          {wo.title}
        </span>
      </td>

      <td className="px-4 py-3 text-[var(--apple-text-secondary)]">
        {wo.yacht?.name ?? "—"}
      </td>

      <td className="px-4 py-3">
        <PriorityBadge priority={wo.priority} />
      </td>

      <td className="px-4 py-3" data-no-row-nav>
        <EditableStatusCell
          workOrderId={wo.id}
          currentStatus={wo.status}
        />
      </td>

      <td className="px-4 py-3 text-[var(--apple-text-secondary)]">
        {wo.dueDate ? formatDateDDMMYY(wo.dueDate) : "—"}
      </td>

      <td className="px-4 py-3 text-[var(--apple-text-secondary)]">
        {wo.assignedTo?.name ?? "Unassigned"}
      </td>
    </tr>
  );
}
