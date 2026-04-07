import Link from "next/link";
import { listPlatformOrganizations } from "@/actions/platform";
import { PlatformNewTenantForm } from "./PlatformNewTenantForm";
import { ChevronRightIcon } from "@/components/ui/Icons";

export default async function PlatformConsolePage() {
  const orgsRes = await listPlatformOrganizations();

  const orgs = orgsRes.data ?? [];
  const orgError = orgsRes.error;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">
          Platform console
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[var(--apple-text-tertiary)]">
          Software operator view: open an organization to see its users and yachts. Tenant admins use the normal fleet
          app; this area is only for accounts with the platform flag.
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
                  <th className="px-4 py-3 w-12" aria-hidden />
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-[var(--apple-border)] last:border-0 transition-colors hover:bg-[var(--apple-bg-subtle)]"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--apple-text-primary)]">
                      <Link
                        href={`/platform/${o.id}`}
                        className="text-[var(--apple-accent)] hover:underline focus:outline-none focus:underline"
                      >
                        {o.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--apple-text-secondary)]">{o.slug}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{o._count.users}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{o._count.yachts}</td>
                    <td className="px-4 py-3 text-[var(--apple-text-tertiary)]">
                      {o.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/platform/${o.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius)] border border-[var(--apple-border)] text-[var(--apple-text-secondary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
                        aria-label={`Open ${o.name}`}
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                    </td>
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
