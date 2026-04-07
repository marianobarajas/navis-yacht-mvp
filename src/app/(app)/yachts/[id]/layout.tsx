import Link from "next/link";
import { getYachtById } from "@/actions/yachts";
import { YachtTabNav } from "./YachtTabNav";
import { YachtEditPanel } from "../YachtEditPanel";
import { canCreateYacht } from "@/lib/rbac";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function YachtIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const canManage = !!session?.user && canCreateYacht((session.user as any)?.role);
  const res = await getYachtById(id);
  if (res.error || !res.data) {
    return (
      <div>
        <p className="text-red-600">{res.error ?? "Not found"}</p>
        <Link href="/yachts" className="text-[var(--oceanops-accent)] hover:underline">← Back to yachts</Link>
      </div>
    );
  }
  const yacht = res.data;
  return (
    <div>
      <Link href="/yachts" className="text-base text-[var(--apple-accent)] hover:underline">← Yachts</Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--apple-text-primary)]">{yacht.name}</h1>
          <p className="mt-1 text-base text-[var(--apple-text-tertiary)]">{yacht.registrationNumber} · {yacht.model} · {yacht.year}</p>
        </div>
        {canManage && (
          <YachtEditPanel
            yacht={{
              id: yacht.id,
              name: yacht.name,
              registrationNumber: yacht.registrationNumber,
              model: yacht.model,
              year: yacht.year,
              ownerName: yacht.ownerName,
              marina: yacht.marina,
              yachtStatus: yacht.yachtStatus,
              maintenanceHealth: yacht.maintenanceHealth,
              coverImageUrl: yacht.coverImageUrl,
              assignmentCount: yacht.assignments?.length ?? 0,
            }}
            variant="button"
          />
        )}
      </div>
      <YachtTabNav yachtId={id} />
      <div className="mt-4 rounded-b-[var(--oceanops-radius)] border border-t-0 border-gray-100 bg-[var(--apple-bg-elevated)] p-6 shadow-[var(--oceanops-shadow)]">
        {children}
      </div>
    </div>
  );
}
