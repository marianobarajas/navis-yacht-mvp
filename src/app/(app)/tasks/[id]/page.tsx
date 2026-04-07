import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isManagerOrAbove } from "@/lib/rbac";
import { requireOrganizationId } from "@/lib/organization";
import { ChevronLeftIcon, CalendarIcon } from "@/components/ui/Icons";

import { TaskAssigneeSection } from "./TaskAssigneeSection";
import { TaskDetailCard } from "./TaskDetailCard";
import TaskCommentsPanel from "./TaskCommentsPanel";
import TaskDeleteButton from "../TaskDeleteButton";

type Params = { id: string };

export default async function TaskDetailPage(props: {
  params: Params | Promise<Params>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return notFound();

  const params = await props.params;
  const id = params?.id;
  if (!id) return notFound();

const order = await prisma.workOrder.findFirst({
  where: { id, yacht: { organizationId } },
  include: {
    yacht: { select: { id: true, name: true } },
    createdBy: { select: { id: true, name: true } },
    assignedTo: { select: { id: true, name: true, profileImage: true } },
    comments: {
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        attachments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            url: true,
            createdAt: true,
            uploader: { select: { id: true, name: true } },
          },
        },
      },
    },
  },
});

  if (!order) return notFound();

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const canManage = isManagerOrAbove(role);
  const canSee = canManage || order.assignedToUserId === userId;
  if (!canSee) {
    return (
      <div>
        <p className="text-red-600">Forbidden</p>
        <Link
          href="/tasks"
          className="mt-2 inline-block font-medium text-[var(--apple-accent)] hover:underline"
        >
          Back to tasks
        </Link>
      </div>
    );
  }

  const canEdit = canManage || order.assignedToUserId === userId;

  const crewUsers = canManage
    ? await prisma.user.findMany({
        where: { isActive: true, organizationId },
        select: { id: true, name: true, profileImage: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--apple-text-primary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Tasks
          </Link>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--apple-text-primary)] transition-colors hover:border-[var(--apple-accent)] hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)]"
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </Link>
        </div>

        {canManage ? (
          <TaskDeleteButton
            workOrderId={order.id}
            label="Delete"
            confirmText={`Delete "${order.title}"? This cannot be undone.`}
            redirectTo="/tasks"
          />
        ) : null}
      </div>

      <TaskAssigneeSection
        workOrderId={order.id}
        assignedTo={order.assignedTo}
        crewUsers={crewUsers}
        canAssign={canManage}
      />

      <TaskDetailCard
        canEdit={canEdit}
        workOrder={{
          id: order.id,
          title: order.title,
          description: order.description,
          equipmentName: order.equipmentName,
          priority: order.priority,
          status: order.status,
          startDate: order.startDate,
          dueDate: order.dueDate,
          yacht: order.yacht,
        }}
      />

      <div>
        <TaskCommentsPanel
          workOrderId={order.id}
          comments={order.comments}
          canComment={canEdit}
          currentUserId={userId}
        />
      </div>
    </div>
  );
}