import Link from "next/link";
import { listLogsByYacht } from "@/actions/logEntries";
import { formatDateDDMMYY } from "@/lib/dateUtils";

export default async function YachtLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await listLogsByYacht(id, 20);
  type LogEntry = { id: string; createdAt: Date; author: { name: string }; entryType: string; text?: string | null };
  const logs: LogEntry[] = res.data ?? [];

  return (
    <div>
      <Link href="/logs" className="text-sm font-medium text-[var(--apple-accent)] hover:underline">View all logs →</Link>
      {logs.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--apple-text-tertiary)]">No logs for this yacht.</p>
      ) : (
        <ul className="mt-4 space-y-2 border-l-2 border-[var(--palette-teal)] pl-4">
          {logs.map((log) => (
            <li key={log.id} className="text-sm">
              <p className="text-[var(--apple-text-tertiary)]">
                {formatDateDDMMYY(log.createdAt)} · {log.author.name} · {log.entryType}
              </p>
              <p className="text-[var(--apple-text-primary)]">{log.text ?? "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
