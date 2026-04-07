import Link from "next/link";
import { getWorkOrdersByYacht } from "@/actions/workOrders";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import type { Priority, WorkOrderStatus } from "@prisma/client";

type WorkOrderLite = { id: string; title: string; priority: Priority; status: WorkOrderStatus };

export default async function YachtWorkOrdersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getWorkOrdersByYacht(id);
  const orders: WorkOrderLite[] = res.data ?? [];

  return (
    <div>
      <Link href="/tasks" className="text-sm font-medium text-[var(--apple-accent)] hover:underline">View all tasks →</Link>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No work orders for this yacht.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {orders.map((wo) => (
            <li key={wo.id}>
              <Link
                href={`/tasks/${wo.id}`}
                className="flex items-center justify-between rounded-[var(--apple-radius)] border border-[var(--apple-border)] p-3 transition-colors hover:bg-[var(--apple-bg-subtle)]"
              >
                <span className="font-medium text-[var(--apple-text-primary)]">{wo.title}</span>
                <div className="flex gap-2">
                  <PriorityBadge priority={wo.priority} />
                  <StatusBadge status={wo.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
