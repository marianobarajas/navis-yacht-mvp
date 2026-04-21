import { Suspense } from "react";
import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listCrew } from "@/actions/users";
import { listYachts } from "@/actions/yachts";
import { canCreateUser, isCaptain, isManagerOrAbove } from "@/lib/rbac";
import { CrewAddMemberCard } from "./CrewAddMemberCard";
import { CrewMembersTable, type CrewTableRow } from "./CrewMembersTable";

export default async function CrewPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  const params = await searchParams;
  const roleFilter = params.role ?? undefined;
  const status = params.status ?? undefined;

  const sessionRole = (session.user as { role?: Role }).role ?? "DECKHAND_1";
  const canManage = isManagerOrAbove(sessionRole);
  const allowCaptainRole = isCaptain(sessionRole);
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissionOverrides: true },
  });
  const canAddCrew = canCreateUser(sessionRole, me?.permissionOverrides as Record<string, boolean> | null);

  const [crewRes, yachtsRes] = await Promise.all([
    listCrew(
      roleFilter || status
        ? { role: roleFilter ?? undefined, shiftStatus: status ?? undefined }
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
        {canManage && canAddCrew ? (
          <div className="mt-6">
            <CrewAddMemberCard yachts={yachts} allowCaptainRole={allowCaptainRole} />
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
