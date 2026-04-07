"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canCreateYacht,
  canAssignYacht,
  isManagerOrAbove,
} from "@/lib/rbac";
import type { Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { removeYachtCoverFromStorage, uploadYachtCoverFile } from "@/lib/yachtCoverStorage";
import { requireOrganizationId } from "@/lib/organization";

export async function listYachts() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  if (isManagerOrAbove(session.user.role)) {
    const yachts = await prisma.yacht.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: {
        assignments: { include: { user: { select: { id: true, name: true, email: true, profileImage: true } } } },
      },
    });
    return { error: null, data: yachts };
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      userId: session.user.id,
      yacht: { organizationId },
    },
    include: {
      yacht: {
        include: {
          assignments: { include: { user: { select: { id: true, name: true, email: true, profileImage: true } } } },
        },
      },
    },
  });
  const yachts = assignments.map((a) => a.yacht);
  return { error: null, data: yachts };
}

export async function getYachtById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const yacht = await prisma.yacht.findFirst({
    where: { id, organizationId },
    include: {
      assignments: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  if (!yacht) return { error: "Not found", data: null };

  if (!isManagerOrAbove(session.user.role)) {
    const assigned = await prisma.assignment.findFirst({
      where: { yachtId: id, userId: session.user.id },
    });
    if (!assigned) return { error: "Forbidden", data: null };
  }
  return { error: null, data: yacht };
}

export async function createYacht(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!canCreateYacht(session.user.role)) return { error: "Forbidden" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const registrationNumber = formData.get("registrationNumber") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string, 10);
  const ownerName = formData.get("ownerName") as string;
  const marina = formData.get("marina") as string;
  const maintenanceHealth = (formData.get("maintenanceHealth") as string) || null;
  const yachtStatusRaw = String(formData.get("yachtStatus") ?? "ACTIVE").trim();
  const allowedStatus = new Set(["ACTIVE", "DOCKED", "IN_SERVICE"]);
  const yachtStatus = allowedStatus.has(yachtStatusRaw) ? yachtStatusRaw : "ACTIVE";

  if (!name?.trim() || !registrationNumber?.trim() || !model?.trim() || !ownerName?.trim() || !marina?.trim())
    return { error: "Missing required fields" };
  if (isNaN(year) || year < 1900 || year > 2100) return { error: "Invalid year" };

  const yacht = await prisma.yacht.create({
    data: {
      organizationId,
      name: name.trim(),
      registrationNumber: registrationNumber.trim(),
      model: model.trim(),
      year,
      ownerName: ownerName.trim(),
      marina: marina.trim(),
      yachtStatus,
      maintenanceHealth: maintenanceHealth?.trim() || null,
      coverImageUrl: null,
    },
  });

  const coverFile = formData.get("coverImage");
  if (coverFile instanceof File && coverFile.size > 0) {
    const { url, error: coverErr } = await uploadYachtCoverFile(yacht.id, coverFile);
    if (coverErr) {
      revalidatePath("/yachts");
      return {
        error: `Yacht created, but the cover image could not be uploaded: ${coverErr}`,
      };
    }
    if (url) {
      await prisma.yacht.update({
        where: { id: yacht.id },
        data: { coverImageUrl: url },
      });
    }
  }

  revalidatePath("/yachts");
  return { error: null };
}

export async function updateYacht(yachtId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!canCreateYacht(session.user.role)) return { error: "Forbidden" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const existing = await prisma.yacht.findFirst({ where: { id: yachtId, organizationId } });
  if (!existing) return { error: "Not found" };

  const name = formData.get("name") as string;
  const registrationNumber = formData.get("registrationNumber") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string, 10);
  const ownerName = formData.get("ownerName") as string;
  const marina = formData.get("marina") as string;
  const maintenanceHealth = (formData.get("maintenanceHealth") as string) || null;
  const yachtStatusRaw = String(formData.get("yachtStatus") ?? "ACTIVE").trim();
  const allowedStatus = new Set(["ACTIVE", "DOCKED", "IN_SERVICE"]);
  const yachtStatus = allowedStatus.has(yachtStatusRaw) ? yachtStatusRaw : "ACTIVE";
  const removeCover = formData.get("removeCoverImage") === "on";
  const coverFile = formData.get("coverImage") as File | null;

  let coverImageUrl: string | null | undefined = undefined;
  if (removeCover) {
    await removeYachtCoverFromStorage(existing.coverImageUrl);
    coverImageUrl = null;
  } else if (coverFile instanceof File && coverFile.size > 0) {
    const { url, error: coverErr } = await uploadYachtCoverFile(yachtId, coverFile);
    if (coverErr) return { error: coverErr };
    coverImageUrl = url ?? null;
  }

  if (!name?.trim() || !registrationNumber?.trim() || !model?.trim() || !ownerName?.trim() || !marina?.trim())
    return { error: "Missing required fields" };
  if (isNaN(year) || year < 1900 || year > 2100) return { error: "Invalid year" };

  await prisma.yacht.update({
    where: { id: yachtId },
    data: {
      name: name.trim(),
      registrationNumber: registrationNumber.trim(),
      model: model.trim(),
      year,
      ownerName: ownerName.trim(),
      marina: marina.trim(),
      yachtStatus,
      maintenanceHealth: maintenanceHealth?.trim() || null,
      ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
    },
  });
  revalidatePath("/yachts");
  revalidatePath(`/yachts/${yachtId}`);
  return { error: null };
}

export async function assignYachtToUser(yachtId: string, userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!canAssignYacht(session.user.role)) return { error: "Forbidden" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const [yacht, crew] = await Promise.all([
    prisma.yacht.findFirst({ where: { id: yachtId, organizationId }, select: { id: true } }),
    prisma.user.findFirst({ where: { id: userId, organizationId }, select: { id: true } }),
  ]);
  if (!yacht || !crew) return { error: "Yacht or user not found in your organization" };

  await prisma.assignment.upsert({
    where: {
      yachtId_userId: { yachtId, userId },
    },
    create: { yachtId, userId },
    update: {},
  });
  revalidatePath("/yachts");
  revalidatePath(`/yachts/${yachtId}`);
  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

export async function unassignYachtFromUser(yachtId: string, userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!canAssignYacht(session.user.role)) return { error: "Forbidden" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const yacht = await prisma.yacht.findFirst({ where: { id: yachtId, organizationId }, select: { id: true } });
  if (!yacht) return { error: "Not found" };

  await prisma.assignment.delete({
    where: {
      yachtId_userId: { yachtId, userId },
    },
  });
  revalidatePath("/yachts");
  revalidatePath(`/yachts/${yachtId}`);
  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

export async function getMaintenanceYachtSummaries() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const yachtsRes = await listYachts();
  if (yachtsRes.error || !yachtsRes.data) return yachtsRes;

  const yachtIds = yachtsRes.data.map((y) => y.id);
  const [openCounts, criticalCounts] = await Promise.all([
    prisma.workOrder.groupBy({
      by: ["yachtId"],
      where: {
        yachtId: { in: yachtIds },
        status: { notIn: ["DONE", "CLOSED"] },
      },
      _count: true,
    }),
    prisma.workOrder.groupBy({
      by: ["yachtId"],
      where: {
        yachtId: { in: yachtIds },
        priority: "CRITICAL",
        status: { notIn: ["DONE", "CLOSED"] },
      },
      _count: true,
    }),
  ]);

  const openMap = new Map(openCounts.map((c) => [c.yachtId, c._count]));
  const criticalMap = new Map(criticalCounts.map((c) => [c.yachtId, c._count]));

  const data = yachtsRes.data.map((y) => ({
    ...y,
    openTaskCount: openMap.get(y.id) ?? 0,
    criticalTaskCount: criticalMap.get(y.id) ?? 0,
    assignedCrewCount: y.assignments.length,
  }));
  return { error: null, data };
}

export async function deleteYacht(yachtId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };
  if (!canCreateYacht((session.user as any).role)) return { error: "Forbidden" }; 
  // Reuso canCreateYacht como "can manage yachts" (si tienes canManageYachts, mejor úsalo)

  if (!yachtId?.trim()) return { error: "Missing yachtId" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const existing = await prisma.yacht.findFirst({ where: { id: yachtId, organizationId } });
  if (!existing) return { error: "Not found" };

  await removeYachtCoverFromStorage(existing.coverImageUrl);
  await prisma.yacht.delete({ where: { id: yachtId } });

  revalidatePath("/yachts");
  return { error: null };
}
