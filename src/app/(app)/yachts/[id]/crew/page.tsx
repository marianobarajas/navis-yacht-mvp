import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAssignYacht } from "@/lib/rbac";
import { getYachtById } from "@/actions/yachts";
import { listCrew } from "@/actions/users";
import { AddCrewPanel } from "./AddCrewPanel";
import { RemoveCrewButton } from "./RemoveCrewButton";
import { RoleBadge } from "@/components/ui/Badge";
import type { Role } from "@prisma/client";
import { ROLE_LABELS, ROLE_ORDER, roleSortIndex } from "@/lib/crew";

type Assignment = {
  id: string;
  user: { id: string; name: string; email: string; role: Role };
};

function sortAssignmentsByRole(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort((a, b) => {
    const pa = a.user.role ?? "DECKHAND_1";
    const pb = b.user.role ?? "DECKHAND_1";
    return roleSortIndex(pa) - roleSortIndex(pb);
  });
}

function groupAssignmentsByRole(assignments: Assignment[]): { key: string; label: string; items: Assignment[] }[] {
  const sorted = sortAssignmentsByRole(assignments);
  const groups: { key: string; label: string; items: Assignment[] }[] = [];
  for (const pos of ROLE_ORDER) {
    const items = sorted.filter((a) => (a.user.role ?? "DECKHAND_1") === pos);
    if (items.length > 0) {
      groups.push({ key: pos, label: ROLE_LABELS[pos], items });
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
  const canAssign = !!session?.user && canAssignYacht((session.user as { role?: string })?.role);

  const [yachtRes, crewRes] = await Promise.all([
    getYachtById(id),
    canAssign ? listCrew({ includeInactive: false }) : Promise.resolve({ data: [] }),
  ]);

  if (yachtRes.error || !yachtRes.data) return null;
  const yacht = yachtRes.data;
  const users = (crewRes as { data?: { id: string; name: string; email: string }[] })?.data ?? [];

  const assignments = yacht.assignments as Assignment[];
  const assignedUserIds = assignments.map((a) => a.user.id);
  const grouped = groupAssignmentsByRole(assignments);

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
                          <RoleBadge role={a.user.role} />
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
