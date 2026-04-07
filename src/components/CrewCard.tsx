import { ShiftBadge, RoleBadge } from "@/components/ui/Badge";
import { roleBorderLeftClass } from "@/lib/uiAccent";
import type { Role, ShiftStatus } from "@prisma/client";

type Crew = {
  id: string;
  name: string;
  email: string;
  role: Role;
  shiftStatus: ShiftStatus;
  profileImage?: string | null;
  _count?: { assignmentsAsUser: number };
};

export function CrewCard({
  crew,
  showAssignments,
  glass,
}: {
  crew: Crew;
  showAssignments?: boolean;
  glass?: boolean;
}) {
  const shell = glass
    ? `rounded-[var(--apple-radius-lg)] border border-white/15 border-l-4 bg-white/5 p-5 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-white/35 hover:bg-white/10 hover:shadow-xl ${roleBorderLeftClass(crew.role)}`
    : `rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] border-l-4 bg-[var(--apple-bg-elevated)] p-5 shadow-[var(--apple-shadow-sm)] transition-all duration-200 hover:shadow-[var(--apple-shadow)] hover:border-[var(--apple-border-strong)] ${roleBorderLeftClass(crew.role)}`;

  return (
    <div className={shell}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[var(--apple-accent-muted)] text-lg font-semibold text-[var(--apple-accent)]">
          {crew.profileImage ? (
            <img
              src={crew.profileImage}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            crew.name.charAt(0)
          )}
          {crew.shiftStatus === "ON_SHIFT" ? (
            <span
              className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[var(--apple-bg-elevated)] bg-[var(--palette-success)]"
              title="On shift"
              aria-hidden
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[var(--apple-text-primary)]">
            {crew.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={crew.role} />
            <ShiftBadge status={crew.shiftStatus} />
          </div>
          {showAssignments && crew._count !== undefined && (
            <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">
              {crew._count.assignmentsAsUser} yacht(s) assigned
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
