import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAssignYacht } from "@/lib/rbac";
import { getYachtById } from "@/actions/yachts";
import { listCrew } from "@/actions/users";
import { AddCrewPanel } from "./AddCrewPanel";
import { RemoveCrewButton } from "./RemoveCrewButton";
import { CrewPositionBadge } from "@/components/ui/Badge";
import type { CrewPosition } from "@prisma/client";
import { CREW_POSITION_LABELS, CREW_POSITION_ORDER, crewPositionSortIndex } from "@/lib/crew";

type Assignment = {
  id: string;
  user: { id: string; name: string; email: string; crewPosition: CrewPosition };
};

function sortAssignmentsByPosition(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort((a, b) => {
    const pa = a.user.crewPosition ?? "DECKHAND_1_2";
    const pb = b.user.crewPosition ?? "DECKHAND_1_2";
    return crewPositionSortIndex(pa) - crewPositionSortIndex(pb);
  });
}

function groupAssignmentsByPosition(assignments: Assignment[]): { key: string; label: string; items: Assignment[] }[] {
  const sorted = sortAssignmentsByPosition(assignments);
  const groups: { key: string; label: string; items: Assignment[] }[] = [];
  for (const pos of CREW_POSITION_ORDER) {
    const items = sorted.filter((a) => (a.user.crewPosition ?? "DECKHAND_1_2") === pos);
    if (items.length > 0) {
      groups.push({ key: pos, label: CREW_POSITION_LABELS[pos], items });
    }
  }
  const seen = new Set(groups.flatMap((g) => g.items));
  const rest = sorted.filter((a) => !seen.has(a));
  if (rest.length > 0) {
    groups.push({ key: "OTHER", label: "Other", items: rest });
  }
  return groups;
}

export default async function YachtCrewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const canAssign = !!session?.user && canAssignYacht((session.user as any)?.role);

  const [yachtRes, crewRes] = await Promise.all([
    getYachtById(id),
    canAssign ? listCrew({ includeInactive: false }) : Promise.resolve({ data: [] }),
  ]);

  if (yachtRes.error || !yachtRes.data) return null;
  const yacht = yachtRes.data;
  const users = (crewRes as any)?.data ?? [];

  const assignments = yacht.assignments as Assignment[];
  const assignedUserIds = assignments.map((a) => a.user.id);
  const grouped = groupAssignmentsByPosition(assignments);

  return (
    <div className="space-y-8">
      {canAssign && (
        <AddCrewPanel yachtId={id} users={users} assignedUserIds={assignedUserIds} />
      )}
      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--apple-border)] bg-[var(--apple-bg-subtle)]/50 py-12 text-center">
          <p className="text-sm text-[var(--apple-text-tertiary)]">No crew assigned to this yacht.</p>
          <p className="mt-1 text-xs text-[var(--apple-text-tertiary)]">Use the panel above to add crew members.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.key}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-secondary)]">
                {group.label}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {group.items.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[var(--apple-accent-muted)] text-base font-semibold text-[var(--apple-accent)] shadow-sm">
                        {a.user.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--apple-text-primary)]">{a.user.name}</p>
                        <p className="truncate text-sm text-[var(--apple-text-secondary)]">{a.user.email}</p>
                        <div className="mt-2">
                          <CrewPositionBadge position={a.user.crewPosition} />
                        </div>
                      </div>
                    </div>
                    {canAssign && (
                      <RemoveCrewButton yachtId={id} userId={a.user.id} userName={a.user.name} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
