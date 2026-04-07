"use client";

import { useState } from "react";
import LogEditModal from "./LogEditModal";
import { PencilIcon } from "@/components/ui/Icons";

type WorkOrderLite = { id: string; title: string };

type LogLite = {
  id: string;
  entryType: string;
  text: string | null;
  workOrderId: string | null;
};

export default function LogEditButton({
  log,
  workOrders,
}: {
  log: LogLite;
  workOrders: WorkOrderLite[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Edit"
        className="flex h-8 w-8 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
      >
        <PencilIcon className="h-4 w-4" />
      </button>

      {open ? (
        <LogEditModal log={log} workOrders={workOrders} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}