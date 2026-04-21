import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listUsers } from "@/actions/users";
import { listYachts } from "@/actions/yachts";
import { canCreateUser } from "@/lib/rbac";
import { CrewAddMemberCard } from "../../crew/CrewAddMemberCard";
import { AdminUsersTable } from "./AdminUsersTable";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const actorRole = ((session?.user as { role?: Role })?.role ?? "") as string;
  const actorUserId = session?.user?.id ?? "";
  const me = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { permissionOverrides: true },
      })
    : null;
  const canAddCrew = canCreateUser(actorRole, me?.permissionOverrides as Record<string, boolean> | null);
  const res = await listUsers();

  const yachtsRes = !res.error ? await listYachts() : null;
  const yachts =
    yachtsRes && !yachtsRes.error && yachtsRes.data
      ? yachtsRes.data.map((y) => ({ id: y.id, name: y.name }))
      : [];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">Team management</h1>
      <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">Manage crew and roles</p>

      {res.error ? <p className="mt-3 text-base text-red-600">{res.error}</p> : null}

      {!res.error && canAddCrew ? (
        <div className="mt-6">
          <CrewAddMemberCard yachts={yachts} allowCaptainRole={actorRole === "CAPTAIN"} />
        </div>
      ) : null}

      <div className="apple-panel mt-8">
        <h2 className="apple-panel-header">
          Users
        </h2>

        {res.data && res.data.length > 0 ? (
          <AdminUsersTable users={res.data} actorRole={actorRole} actorUserId={actorUserId} />
        ) : (
          <p className="p-8 text-center text-base text-[var(--apple-text-secondary)]">No users.</p>
        )}
      </div>
    </div>
  );
}