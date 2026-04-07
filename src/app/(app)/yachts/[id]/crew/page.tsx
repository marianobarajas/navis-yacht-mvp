import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAssignYacht } from "@/lib/rbac";
import { getYachtById } from "@/actions/yachts";
import { listCrew } from "@/actions/users";
import { AddCrewPanel } from "./AddCrewPanel";
import { RemoveCrewButton } from "./RemoveCrewButton";
import { RoleBadge } from "@/components/ui/Badge";

const ROLE_ORDER = ["ADMIN", "MANAGER", "TECHNICIAN"] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admins",
  MANAGER: "Managers",
  TECHNICIAN: "Technicians",
};

type Assignment = { id: string; user: { id: string; name: string; email: string; role?: string } };

function sortAssignmentsByRole(assignments: Assignment[]): Assignment[] {
  return [...assignments].sort((a, b) => {
    const roleA = a.user.role ?? "TECHNICIAN";
    const roleB = b.user.role ?? "TECHNICIAN";
    const idxA = ROLE_ORDER.indexOf(roleA as (typeof ROLE_ORDER)[number]);
    const idxB = ROLE_ORDER.indexOf(roleB as (typeof ROLE_ORDER)[number]);
    const orderA = idxA >= 0 ? idxA : ROLE_ORDER.length;
    const orderB = idxB >= 0 ? idxB : ROLE_ORDER.length;
    return orderA - orderB;
  });
}

function groupAssignmentsByRole(assignments: Assignment[]): { role: string; label: string; items: Assignment[] }[] {
  const sorted = sortAssignmentsByRole(assignments);
  const groups: { role: string; label: string; items: Assignment[] }[] = [];
  for (const r of ROLE_ORDER) {
    const items = sorted.filter((a) => (a.user.role ?? "TECHNICIAN") === r);
    if (items.length > 0) {
      groups.push({ role: r, label: ROLE_LABELS[r] ?? r, items });
    }
  }
  // Include any role not in ROLE_ORDER
  const seen = new Set(groups.flatMap((g) => g.items));
  const rest = sorted.filter((a) => !seen.has(a));
  if (rest.length > 0) {
    groups.push({ role: "OTHER", label: "Other", items: rest });
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
            <section key={group.role}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--apple-text-tertiary)]">
                {group.label}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {group.items.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--apple-accent-muted)] text-base font-semibold text-[var(--apple-accent)]">
                        {a.user.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--apple-text-primary)]">{a.user.name}</p>
                        <p className="truncate text-sm text-[var(--apple-text-tertiary)]">{a.user.email}</p>
                        {a.user.role && (
                          <div className="mt-2">
                            <RoleBadge role={a.user.role} />
                          </div>
                        )}
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
