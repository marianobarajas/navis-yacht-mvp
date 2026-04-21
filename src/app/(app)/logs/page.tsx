import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listYachts } from "@/actions/yachts";
import { listExpenseLogsByYacht } from "@/actions/expenseLogs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { canCreateWorkOrder } from "@/lib/rbac";
import { requireOrganizationId } from "@/lib/organization";
import { ExpenseLogsView } from "./ExpenseLogsView";

function mapExpenseStatusForClient(log: { status?: string | null }): string {
  const s = log.status as string | undefined;
  if (s === "DONE" || s === "PAID") return "PAID";
  if (s === "IN_PROGRESS" || s === "APPROVED") return "APPROVED";
  if (s === "NOT_STARTED" || s === "PENDING_APPROVAL") return "PENDING_APPROVAL";
  return s ?? "PENDING_APPROVAL";
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ yachtId?: string; period?: string; from?: string; to?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");

  const organizationId = requireOrganizationId(session);
  if (!organizationId) redirect("/signin");

  const params = await searchParams;
  const role = (session.user as any).role as string;
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { permissionOverrides: true },
  });
  const canCreateTask = canCreateWorkOrder(role, me?.permissionOverrides as Record<string, boolean> | null);

  const [yachtsRes, users] = await Promise.all([
    listYachts(),
    prisma.user.findMany({
      where: { isActive: true, organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const yachts = (yachtsRes as any)?.data ?? [];
  const yachtList = yachts.map((y: any) => ({ id: y.id, name: y.name }));
  const userList = users.map((u) => ({ id: u.id, name: u.name }));

  const yachtId = params.yachtId ?? yachtList[0]?.id ?? null;
  const logsRes = yachtId ? await listExpenseLogsByYacht(yachtId) : { error: null, data: [] };

  const rawLogs = (logsRes as any)?.data ?? [];
  const logs = rawLogs.map((log: any) => ({
    ...log,
    cost: Number(log.cost),
    date: log.date instanceof Date ? log.date.toISOString() : log.date,
    status: mapExpenseStatusForClient(log),
  }));
  const error = (logsRes as any)?.error ?? null;

  return (
    <div className="flex w-full min-w-0 min-h-[calc(100vh-12rem)] flex-col">
      <ExpenseLogsView
        yachts={yachtList}
        selectedYachtId={yachtId}
        logs={logs}
        error={error}
        users={userList}
        canCreateTask={canCreateTask}
        title="Expenses"
        subtitle="Track and manage yacht spending"
      />
    </div>
  );
}
