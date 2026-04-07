import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listUsers } from "@/actions/users";
import UserCreatePanel from "./UserCreatePanel";
import { AdminUsersTable } from "./AdminUsersTable";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const actorRole = (session?.user as any)?.role ?? "";
  const res = await listUsers();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">Team management</h1>
      <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">Manage crew and roles</p>

      {res.error ? <p className="mt-3 text-base text-red-600">{res.error}</p> : null}

      {!res.error ? (
        <div className="mt-8">
          <UserCreatePanel allowAdminRole={actorRole === "ADMIN"} />
        </div>
      ) : null}

      <div className="apple-panel mt-8">
        <h2 className="apple-panel-header">
          Users
        </h2>

        {res.data && res.data.length > 0 ? (
          <AdminUsersTable users={res.data} actorRole={actorRole} />
        ) : (
          <p className="p-8 text-center text-base text-[var(--apple-text-secondary)]">No users.</p>
        )}
      </div>
    </div>
  );
}