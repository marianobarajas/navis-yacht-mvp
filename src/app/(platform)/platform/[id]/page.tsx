import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlatformOrganizationById } from "@/actions/platform";
import { ChevronLeftIcon } from "@/components/ui/Icons";

type Props = { params: Promise<{ id: string }> };

export default async function PlatformOrganizationPage(props: Props) {
  const { id } = await props.params;
  if (!id) notFound();

  const res = await getPlatformOrganizationById(id);
  if (res.error === "Unauthorized") {
    return (
      <div>
        <p className="text-red-600">Unauthorized</p>
        <Link href="/signin" className="mt-2 inline-block text-[var(--apple-accent)] hover:underline">
          Sign in
        </Link>
      </div>
    );
  }
  if (res.error === "Not found" || !res.data) {
    notFound();
  }

  const org = res.data;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/platform"
          className="mb-4 inline-flex items-center gap-2 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--apple-text-primary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          All organizations
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">{org.name}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--apple-text-tertiary)]">
          <span>
            Slug: <code className="font-mono text-[var(--apple-text-secondary)]">{org.slug}</code>
          </span>
          <span>Created {org.createdAt.toLocaleDateString()}</span>
          <span>
            {org._count.users} user{org._count.users === 1 ? "" : "s"} · {org._count.yachts} yacht
            {org._count.yachts === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-[var(--apple-text-primary)]">Users</h2>
        <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">Fleet accounts in this organization.</p>
        {org.users.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--apple-text-secondary)]">No users yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)]">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] text-xs font-semibold uppercase tracking-wide text-[var(--apple-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {org.users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--apple-border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--apple-text-primary)]">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--apple-text-secondary)]">{u.email}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">{u.isActive ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-[var(--apple-text-tertiary)]">
                      {u.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--apple-text-primary)]">Yachts</h2>
        <p className="mt-1 text-sm text-[var(--apple-text-tertiary)]">Vessels registered under this tenant.</p>
        {org.yachts.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--apple-text-secondary)]">No yachts yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[var(--apple-radius-lg)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] shadow-[var(--apple-shadow-sm)]">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-[var(--apple-border)] bg-[var(--apple-bg-subtle)] text-xs font-semibold uppercase tracking-wide text-[var(--apple-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Registration</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Marina</th>
                </tr>
              </thead>
              <tbody>
                {org.yachts.map((y) => (
                  <tr key={y.id} className="border-b border-[var(--apple-border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--apple-text-primary)]">{y.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--apple-text-secondary)]">
                      {y.registrationNumber}
                    </td>
                    <td className="px-4 py-3 text-[var(--apple-text-secondary)]">{y.model}</td>
                    <td className="px-4 py-3 tabular-nums">{y.year}</td>
                    <td className="px-4 py-3 text-[var(--apple-text-tertiary)]">{y.marina}</td>
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
