import Link from "next/link";
import { formatDateDDMMYY } from "@/lib/dateUtils";

type Log = {
  id: string;
  entryType: string;
  text: string | null;
  createdAt: Date;
  yacht: { id: string; name: string };
  workOrder: { id: string; title: string } | null;
  author: { id: string; name: string };
};

export function LogList({ logs, limit = 6 }: { logs: Log[]; limit?: number }) {
  const list = logs.slice(0, limit);

  if (list.length === 0) {
    return (
      <div className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-6 shadow-[var(--apple-shadow-sm)]">
        <h3 className="text-sm font-medium text-[var(--apple-text-secondary)]">
          Notes &amp; Logs
        </h3>
        <p className="mt-4 text-center text-sm text-[var(--apple-text-tertiary)]">
          No log entries yet
        </p>
        <Link
          href="/logs"
          aria-label="New log"
          className="mt-3 flex items-center justify-center gap-2 rounded-[var(--apple-radius)] border border-[var(--apple-accent)] bg-[var(--apple-accent-muted)] px-4 py-2 text-sm font-medium text-[var(--apple-accent)] transition-colors hover:bg-[var(--apple-accent-muted-hover)]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-[var(--apple-shadow-sm)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--apple-text-secondary)]">
          Notes &amp; Logs
        </h3>
        <Link
          href="/logs"
          className="text-sm font-medium text-[var(--apple-accent)] hover:underline"
        >
          New log
        </Link>
      </div>
      <ul className="mt-3 space-y-3">
        {list.map((log) => (
          <li
            key={log.id}
            className="border-l-[3px] border-[var(--palette-muted-teal)] pl-4 py-1"
          >
            <p className="text-xs text-[var(--apple-text-tertiary)]">
              {log.yacht.name}
              {log.workOrder && ` · ${log.workOrder.title}`} · {log.author.name}{" "}
              · {formatDateDDMMYY(log.createdAt)}
            </p>
            <p className="text-sm text-[var(--apple-text-primary)]">
              {log.entryType}: {log.text || "—"}
            </p>
          </li>
        ))}
      </ul>
      <Link
        href="/logs"
        aria-label="View all logs"
        className="mt-3 flex items-center justify-end gap-1 text-sm font-medium text-[var(--apple-accent)] hover:underline"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Link>
    </div>
  );
}
