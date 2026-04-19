import { ShiftBadge, RoleBadge } from "@/components/ui/Badge";
import { roleBorderLeftClass } from "@/lib/uiAccent";
import { shiftStatusShowsActiveDot } from "@/lib/crew";
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
    ? `rounded-[var(--apple-radius-lg)] border border-white/20 border-l-4 bg-white/[0.08] p-5 shadow-md shadow-black/25 ring-1 ring-white/15 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-white/40 hover:bg-white/[0.12] hover:ring-white/25 hover:shadow-xl ${roleBorderLeftClass(crew.role)}`
    : `rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] border-l-4 bg-[var(--apple-bg-elevated)] p-5 shadow-[var(--apple-shadow-sm)] transition-all duration-200 hover:shadow-[var(--apple-shadow)] hover:border-[var(--apple-border-strong)] ${roleBorderLeftClass(crew.role)}`;

  const showDot = shiftStatusShowsActiveDot(crew.shiftStatus);

  return (
    <div className={shell}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-white/25 bg-[var(--apple-accent-muted)] text-lg font-semibold text-[var(--apple-accent)] shadow-inner shadow-black/20">
          {crew.profileImage ? (
            <img
              src={crew.profileImage}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            crew.name.charAt(0)
          )}
          {showDot ? (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px] border-[var(--apple-bg-elevated)] bg-[var(--palette-success)] shadow-sm ring-1 ring-black/30"
              title="On duty or active"
              aria-hidden
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold tracking-tight text-[var(--apple-text-primary)] drop-shadow-sm">
            {crew.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={crew.role} />
            <ShiftBadge status={crew.shiftStatus} />
          </div>
          {showAssignments && crew._count !== undefined && (
            <p className="mt-2 text-sm font-medium text-[var(--apple-text-secondary)]">
              {crew._count.assignmentsAsUser} yacht(s) assigned
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
