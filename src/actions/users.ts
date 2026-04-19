"use server";

import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hash, compare } from "bcryptjs";
import { canAssignYacht, canAssignRole, canCreateUser, canEditUserRole, isCaptain, isManagerOrAbove } from "@/lib/rbac";
import { sendInviteEmail } from "@/lib/mail";
import type { Role, ShiftStatus } from "@prisma/client";
import { ROLE_ORDER, SHIFT_STATUS_ORDER } from "@/lib/crew";
import { revalidatePath } from "next/cache";
import { requireOrganizationId } from "@/lib/organization";

export async function listUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const role = session.user.role as Role;
  if (!isManagerOrAbove(role)) return { error: "Forbidden", data: null };

  const users = await prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      shiftStatus: true,
      createdAt: true,
    },
  });

  return { error: null, data: users };
}

export async function listCrew(filters?: {
  role?: string;
  shiftStatus?: string;
  includeInactive?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const where: {
    organizationId: string;
    isActive?: boolean;
    role?: Role;
    shiftStatus?: ShiftStatus;
  } = { organizationId };

  if (!filters?.includeInactive) where.isActive = true;

  if (filters?.role) where.role = filters.role as Role;
  if (filters?.shiftStatus) where.shiftStatus = filters.shiftStatus as ShiftStatus;

  const users = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      shiftStatus: true,
      isActive: true,
      profileImage: true,
      _count: { select: { assignmentsAsUser: true } },
      assignmentsAsUser: {
        include: {
          yacht: { select: { id: true, name: true } },
        },
      },
    },
  });

  return { error: null, data: users };
}

export async function getUserWithAssignments(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized", data: null };

  const role = session.user.role as Role;
  if (!isManagerOrAbove(role)) return { error: "Forbidden", data: null };

  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      shiftStatus: true,
      permissionOverrides: true,
      createdAt: true,
      assignmentsAsUser: {
        include: {
          yacht: { select: { id: true, name: true, registrationNumber: true, marina: true } },
        },
      },
    },
  });

  if (!user) return { error: "Not found", data: null };
  return { error: null, data: user };
}

/** Current user's own profile (assignments, permissions) – for View Profile page. */
export async function getCurrentUserProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", data: null };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      shiftStatus: true,
      permissionOverrides: true,
      notificationPreferences: true,
      profileImage: true,
      assignmentsAsUser: {
        include: {
          yacht: { select: { id: true, name: true, registrationNumber: true, marina: true } },
        },
      },
    },
  });

  if (!user) return { error: "Not found", data: null };
  return { error: null, data: user };
}

/** Update current user's own editable fields (name, shift status only). */
export async function updateCurrentUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const shiftStatus = String(formData.get("shiftStatus") ?? "").trim();

  if (!name) return { error: "Name is required" };

  const allowedShift = [...SHIFT_STATUS_ORDER];
  if (shiftStatus && !allowedShift.includes(shiftStatus as ShiftStatus)) return { error: "Invalid shift status" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      ...(shiftStatus ? { shiftStatus: shiftStatus as ShiftStatus } : {}),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { error: null };
}

/** Current user updates their own password (requires current password). */
export async function updateOwnPassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const current = String(currentPassword).trim();
  const next = String(newPassword).trim();
  if (!current) return { error: "Current password is required" };
  if (next.length < 8) return { error: "New password must be at least 8 characters" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "User not found" };

  const valid = await compare(current, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect" };

  const passwordHash = await hash(next, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  revalidatePath("/profile");
  return { error: null };
}

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!canCreateUser(myRole)) return { error: "Forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "").trim();
  const role = roleInput as Role;

  if (!name || !email || !password || !roleInput) return { error: "Missing fields" };

  if (!ROLE_ORDER.includes(role)) return { error: "Invalid role" };
  if (!canAssignRole(myRole, role)) return { error: "Forbidden" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already in use" };

  const passwordHash = await hash(password, 10);
  const initialYachtId = String(formData.get("initialYachtId") ?? "").trim();

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      organizationId,
      isPlatformAdmin: false,
    },
    select: { id: true },
  });

  if (initialYachtId && canAssignYacht(myRole)) {
    const yacht = await prisma.yacht.findFirst({
      where: { id: initialYachtId, organizationId },
      select: { id: true },
    });
    if (yacht) {
      await prisma.assignment.upsert({
        where: {
          yachtId_userId: { yachtId: initialYachtId, userId: created.id },
        },
        create: { yachtId: initialYachtId, userId: created.id },
        update: {},
      });
      revalidatePath("/yachts");
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

export async function deactivateUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!isManagerOrAbove(myRole)) return { error: "Forbidden" };

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };

  if (target.role === "CAPTAIN" && !isCaptain(myRole)) {
    return { error: "Only a Captain can deactivate another Captain" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

/**
 * Hard-delete user. Reassigns WorkOrder/Document rows they created so FK constraints allow delete.
 * Cascades remove notifications, assignments, comments, etc. per schema.
 */
export async function deleteUserPermanently(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!isManagerOrAbove(myRole)) return { error: "Forbidden" };

  const actorId = session.user.id;
  if (userId === actorId) return { error: "You cannot delete your own account" };

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };

  if (target.role === "CAPTAIN" && !isCaptain(myRole)) {
    return { error: "Only a Captain can delete another Captain" };
  }

  if (target.role === "CAPTAIN") {
    const otherCaptains = await prisma.user.count({
      where: { role: "CAPTAIN", id: { not: userId }, organizationId },
    });
    if (otherCaptains === 0) return { error: "Cannot delete the last Captain" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.workOrder.updateMany({
        where: { createdByUserId: userId },
        data: { createdByUserId: actorId },
      });
      await tx.workOrder.updateMany({
        where: { assignedToUserId: userId },
        data: { assignedToUserId: null },
      });
      await tx.documentFolder.updateMany({
        where: { createdByUserId: userId },
        data: { createdByUserId: actorId },
      });
      await tx.document.updateMany({
        where: { createdByUserId: userId },
        data: { createdByUserId: actorId },
      });
      await tx.user.delete({ where: { id: userId } });
    });
  } catch (e) {
    console.error("[deleteUserPermanently]", e);
    return {
      error:
        "Could not delete this user. They may still be linked to data that cannot be reassigned automatically.",
    };
  }

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  revalidatePath("/yachts");
  revalidatePath("/tasks");
  return { error: null };
}

export async function reactivateUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!isManagerOrAbove(myRole)) return { error: "Forbidden" };

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };

  if (target.role === "CAPTAIN" && !isCaptain(myRole)) {
    return { error: "Only a Captain can reactivate another Captain" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

export async function updateUser(userId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const actorRole = (session.user as { role?: Role }).role as Role;
  if (!isManagerOrAbove(actorRole)) return { error: "Forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleInput = String(formData.get("role") ?? "").trim() as Role;
  const shiftStatusRaw = String(formData.get("shiftStatus") ?? "").trim();
  const isActiveRaw = String(formData.get("isActive") ?? "true").trim();

  if (!name || !email) return { error: "Name and email are required" };

  if (!ROLE_ORDER.includes(roleInput)) return { error: "Invalid role" };
  if (!canAssignRole(actorRole, roleInput)) return { error: "Forbidden" };

  const allowedShift = [...SHIFT_STATUS_ORDER];
  if (!shiftStatusRaw || !allowedShift.includes(shiftStatusRaw as ShiftStatus)) return { error: "Invalid shift status" };
  const shiftStatus = shiftStatusRaw as ShiftStatus;

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, role: true, email: true },
  });
  if (!target) return { error: "User not found" };

  if (!canEditUserRole(actorRole, target.role)) return { error: "Forbidden" };

  if (email !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "Email already in use" };
  }

  const isActive = isActiveRaw === "true" || isActiveRaw === "1" || isActiveRaw === "on";

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      role: roleInput,
      shiftStatus,
      isActive,
    },
  });

  revalidatePath("/crew");
  revalidatePath("/admin/users");
  return { error: null };
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!isManagerOrAbove(myRole)) return { error: "Forbidden" };

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };

  if (target.role === "CAPTAIN" && !isCaptain(myRole)) {
    return { error: "Only a Captain can reset another Captain's password" };
  }

  const password = String(newPassword).trim();
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const passwordHash = await hash(password, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

export async function updateUserPermissionOverrides(
  userId: string,
  overrides: Record<string, boolean>
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!isManagerOrAbove(myRole)) return { error: "Forbidden" };

  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };
  if (target.role === "CAPTAIN" && !isCaptain(myRole)) return { error: "Cannot edit a Captain's permissions" };

  await prisma.user.update({
    where: { id: userId },
    data: { permissionOverrides: overrides as object },
  });

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function formatInviteEmailError(detail: string): string {
  if (/testing emails to your own email|verify a domain at resend/i.test(detail)) {
    return `${detail} To deliver invites to other inboxes: verify your domain at https://resend.com/domains and set RESEND_FROM in your environment to an address on that domain.`;
  }
  return detail;
}

/** Create a pending user and email an invite link (no password until they accept). */
export async function sendUserInvite(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const organizationId = requireOrganizationId(session);
  if (!organizationId) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!canCreateUser(myRole)) return { error: "Forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleInput = String(formData.get("role") ?? "").trim();
  const role = roleInput as Role;
  const initialYachtId = String(formData.get("initialYachtId") ?? "").trim();

  if (!name || !email || !roleInput) return { error: "Missing fields" };

  if (!ROLE_ORDER.includes(role)) return { error: "Invalid role" };
  if (!canAssignRole(myRole, role)) return { error: "Forbidden" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already in use" };

  const inviteToken = randomBytes(32).toString("hex");
  const placeholderPassword = await hash(randomBytes(32).toString("hex"), 10);

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: placeholderPassword,
      role,
      organizationId,
      isPlatformAdmin: false,
      inviteToken,
      inviteTokenExpiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
    },
    select: { id: true },
  });

  if (initialYachtId && canAssignYacht(myRole)) {
    const yacht = await prisma.yacht.findFirst({
      where: { id: initialYachtId, organizationId },
      select: { id: true },
    });
    if (yacht) {
      await prisma.assignment.upsert({
        where: {
          yachtId_userId: { yachtId: initialYachtId, userId: created.id },
        },
        create: { yachtId: initialYachtId, userId: created.id },
        update: {},
      });
      revalidatePath("/yachts");
    }
  }

  const mail = await sendInviteEmail({ to: email, name, inviteToken });
  if (mail.error) {
    await prisma.user.delete({ where: { id: created.id } });
    return { error: formatInviteEmailError(mail.error) };
  }

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return {
    error: null,
    devInviteUrl: mail.devInviteUrl,
    resendEmailId: mail.resendEmailId,
  };
}

/** Complete invite: set password and clear invite token. */
export async function acceptUserInvite(token: string, password: string) {
  const t = String(token ?? "").trim();
  const pw = String(password ?? "").trim();
  if (!t || pw.length < 8) return { error: "Invalid token or password must be at least 8 characters" };

  const user = await prisma.user.findFirst({
    where: { inviteToken: t },
    select: { id: true, inviteTokenExpiresAt: true },
  });
  if (!user) return { error: "Invalid or expired invite link" };
  if (!user.inviteTokenExpiresAt || user.inviteTokenExpiresAt.getTime() < Date.now()) {
    return { error: "This invite has expired. Ask an administrator to send a new one." };
  }

  const passwordHash = await hash(pw, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      inviteToken: null,
      inviteTokenExpiresAt: null,
    },
  });

  return { error: null };
}
