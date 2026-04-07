import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listYachts } from "@/actions/yachts";
import { canCreateYacht } from "@/lib/rbac";

import { YachtsList } from "./YachtsList";

export default async function YachtsPage() {
  const session = await getServerSession(authOptions);
  const res = await listYachts();

  const role = (session?.user as any)?.role;
  const canManage = !!session?.user && canCreateYacht(role);

  const yachts = (res as any)?.data ?? [];
  const error = (res as any)?.error ?? null;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">Yachts</h1>
      <p className="mt-2 text-base text-[var(--apple-text-tertiary)]">Fleet overview, status, and crew</p>

      {error ? <p className="mt-3 text-base text-red-600">{error}</p> : null}

      <div className="mt-8">
        <YachtsList yachts={yachts} canManage={canManage} />
      </div>
    </div>
  );
}