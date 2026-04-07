import { getYachtById } from "@/actions/yachts";

export default async function YachtOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getYachtById(id);
  if (res.error || !res.data) return null;
  const yacht = res.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] p-4">
          <p className="text-xs text-[var(--apple-text-tertiary)]">Owner</p>
          <p className="font-medium text-[var(--apple-text-primary)]">{yacht.ownerName}</p>
        </div>
        <div className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] p-4">
          <p className="text-xs text-[var(--apple-text-tertiary)]">Marina</p>
          <p className="font-medium text-[var(--apple-text-primary)]">{yacht.marina}</p>
        </div>
        <div className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] p-4">
          <p className="text-xs text-[var(--apple-text-tertiary)]">Health</p>
          <p className="font-medium text-[var(--apple-text-primary)]">{yacht.maintenanceHealth ?? "—"}</p>
        </div>
        <div className="rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] p-4">
          <p className="text-xs text-[var(--apple-text-tertiary)]">Crew assigned</p>
          <p className="font-medium text-[var(--apple-text-primary)]">{yacht.assignments.length}</p>
        </div>
      </div>
      <p className="text-sm text-[var(--apple-text-tertiary)]">Use Work Orders, Logs, and Crew tabs for details.</p>
    </div>
  );
}
