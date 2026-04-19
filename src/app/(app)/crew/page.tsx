import { Suspense } from "react";
import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { listCrew } from "@/actions/users";
import { listYachts } from "@/actions/yachts";
import { isManagerOrAbove } from "@/lib/rbac";
import { CrewAddMemberCard } from "./CrewAddMemberCard";
import { CrewMembersTable, type CrewTableRow } from "./CrewMembersTable";

export default async function CrewPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const params = await searchParams;
  const position = params.position ?? undefined;
  const status = params.status ?? undefined;

  const sessionRole = (session.user as { role?: Role }).role ?? "TECHNICIAN";
  const canManage = isManagerOrAbove(sessionRole);
  const allowAdminRole = sessionRole === "ADMIN";

  const [crewRes, yachtsRes] = await Promise.all([
    listCrew(
      position || status
        ? { crewPosition: position ?? undefined, shiftStatus: status ?? undefined }
        : undefined
    ),
    listYachts(),
  ]);

  if (crewRes.error) {
    return <p className="text-red-600">{crewRes.error}</p>;
  }

  const crewRaw = crewRes.data ?? [];
  const yachts =
    yachtsRes.error || !yachtsRes.data
      ? []
      : yachtsRes.data.map((y) => ({ id: y.id, name: y.name }));

  const crew: CrewTableRow[] = crewRaw.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role,
    crewPosition: c.crewPosition,
    shiftStatus: c.shiftStatus,
    isActive: c.isActive,
    profileImage: c.profileImage ?? null,
    assignmentsAsUser: c.assignmentsAsUser ?? [],
  }));

  return (
    <div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">
          Team management
        </h1>
        <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">Manage crew and roles</p>
      </div>

      <Suspense
        fallback={
          <div className="mt-8 h-64 animate-pulse rounded-[var(--apple-radius-lg)] bg-[var(--apple-bg-elevated)]" />
        }
      >
        {canManage ? (
          <div className="mt-6">
            <CrewAddMemberCard yachts={yachts} allowAdminRole={allowAdminRole} />
          </div>
        ) : null}

        <CrewMembersTable
          crew={crew}
          yachts={yachts}
          canManage={canManage}
          actorRole={sessionRole}
        />
      </Suspense>
    </div>
  );
}
