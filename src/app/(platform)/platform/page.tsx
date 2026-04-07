import { listPlatformOrganizations, listPlatformTenantUsers } from "@/actions/platform";
import { PlatformNewTenantForm } from "./PlatformNewTenantForm";

export default async function PlatformConsolePage() {
  const [orgsRes, usersRes] = await Promise.all([
    listPlatformOrganizations(),
    listPlatformTenantUsers(),
  ]);

  const orgs = orgsRes.data ?? [];
  const users = usersRes.data ?? [];
  const orgError = orgsRes.error;
  const usersError = usersRes.error;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">
          Platform console
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[var(--apple-text-tertiary)]">
          Software operator view: all customer organizations and their users. Tenant admins use the normal fleet app;
          this area is only for accounts with the platform flag.
        </p>
      </div>

      <PlatformNewTenantForm />

      <section>
        <h2 className="text-lg font-semibold text-[var(--apple-text-primary)]">Organizations</h2>
        {orgError ? (
          <p className="mt-2 text-sm text-red-600">{orgError}</p>
        ) : orgs.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--apple-text-secondary)]">No organizations yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)]">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] text-xs font-semibold uppercase tracking-wide text-[var(--apple-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3 text-right">Users</th>
                  <th className="px-4 py-3 text-right">Yachts</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--apple-border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--apple-text-primary)]">{o.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--apple-text-secondary)]">{o.slug}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{o._count.users}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{o._count.yachts}</td>
                    <td className="px-4 py-3 text-[var(--apple-text-tertiary)]">
                      {o.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--apple-text-primary)]">Tenant users</h2>
        <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">
          All fleet users by organization (platform account excluded).
        </p>
        {usersError ? (
          <p className="mt-2 text-sm text-red-600">{usersError}</p>
        ) : users.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--apple-text-secondary)]">No tenant users.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)]">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] text-xs font-semibold uppercase tracking-wide text-[var(--apple-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--apple-border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--apple-text-primary)]">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--apple-text-secondary)]">{u.email}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3 text-[var(--apple-text-secondary)]">
                      {u.organization ? (
                        <>
                          {u.organization.name}{" "}
                          <span className="font-mono text-xs text-[var(--apple-text-tertiary)]">
                            ({u.organization.slug})
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{u.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
