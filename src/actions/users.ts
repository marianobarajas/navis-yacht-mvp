"use server";

import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hash, compare } from "bcryptjs";
import { canAssignYacht, canCreateUser } from "@/lib/rbac";
import { sendInviteEmail } from "@/lib/mail";
import type { Role, ShiftStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

function canManageUsers(role: Role) {
  return role === "ADMIN" || role === "MANAGER";
}

export async function listUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized", data: null };

  const role = session.user.role as Role;
  if (!canManageUsers(role)) return { error: "Forbidden", data: null };

  const users = await prisma.user.findMany({
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

  const where: {
    isActive?: boolean;
    role?: Role;
    shiftStatus?: ShiftStatus;
  } = {};

  // Por default: solo activos
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
      isActive: true, // ✅ NECESARIO si vas a editar/mostrar activo/inactivo
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

  const role = session.user.role as Role;
  if (!canManageUsers(role)) return { error: "Forbidden", data: null };

  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  const allowedShift = ["ON_SHIFT", "OFF_DUTY", "UNAVAILABLE"];
  if (shiftStatus && !allowedShift.includes(shiftStatus)) return { error: "Invalid shift status" };

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

  const myRole = session.user.role as Role;
  if (!canCreateUser(myRole)) return { error: "Forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const roleInput = String(formData.get("role") ?? "").trim();
  const role = roleInput as Role;

  if (!name || !email || !password || !role) return { error: "Missing fields" };

  const allowedRoles: Role[] =
    myRole === "ADMIN" ? ["ADMIN", "MANAGER", "TECHNICIAN"] : ["MANAGER", "TECHNICIAN"];
  if (!allowedRoles.includes(role)) return { error: "Invalid role for your account" };

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
    },
    select: { id: true },
  });

  if (initialYachtId && canAssignYacht(myRole)) {
    const yacht = await prisma.yacht.findUnique({
      where: { id: initialYachtId },
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

  const myRole = session.user.role as Role;
  if (!canManageUsers(myRole)) return { error: "Forbidden" };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };

  // Manager no puede desactivar Admin
  if (target.role === "ADMIN" && myRole !== "ADMIN") {
    return { error: "Only ADMIN can deactivate ADMIN users" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

export async function reactivateUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!canManageUsers(myRole)) return { error: "Forbidden" };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };

  // Manager no puede “revivir” Admin si no es Admin (por simetría)
  if (target.role === "ADMIN" && myRole !== "ADMIN") {
    return { error: "Only ADMIN can reactivate ADMIN users" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

/**
 * ✅ Este es el que te faltaba para EDITAR desde /crew
 * Permite cambiar: name, role, shiftStatus, isActive, email
 */
export async function updateUser(userId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const actorRole = (session.user as any).role as Role;
  if (actorRole !== "ADMIN" && actorRole !== "MANAGER") return { error: "Forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleInput = String(formData.get("role") ?? "").trim() as Role;
  const shiftStatus = String(formData.get("shiftStatus") ?? "").trim() as any;
  const isActiveRaw = String(formData.get("isActive") ?? "true").trim();

  if (!name || !email) return { error: "Name and email are required" };

  const allowedRoles: Role[] = actorRole === "ADMIN"
    ? ["ADMIN", "MANAGER", "TECHNICIAN"]
    : ["MANAGER", "TECHNICIAN"]; // MANAGER no puede hacer admins

  if (!allowedRoles.includes(roleInput)) return { error: "Invalid role" };

  const allowedShift = ["ON_SHIFT", "OFF_DUTY", "UNAVAILABLE"];
  if (shiftStatus && !allowedShift.includes(shiftStatus)) return { error: "Invalid shift status" };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });
  if (!target) return { error: "User not found" };

  // Solo ADMIN puede tocar ADMINs
  if (target.role === "ADMIN" && actorRole !== "ADMIN") {
    return { error: "Only ADMIN can edit ADMIN users" };
  }

  // Evitar emails duplicados
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

  const myRole = session.user.role as Role;
  if (myRole !== "ADMIN" && myRole !== "MANAGER") return { error: "Forbidden" };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };

  if (target.role === "ADMIN" && myRole !== "ADMIN") {
    return { error: "Only ADMIN can reset ADMIN passwords" };
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

  const myRole = session.user.role as Role;
  if (myRole !== "ADMIN" && myRole !== "MANAGER") return { error: "Forbidden" };

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "User not found" };
  if (target.role === "ADMIN" && myRole !== "ADMIN") return { error: "Cannot edit ADMIN permissions" };

  await prisma.user.update({
    where: { id: userId },
    data: { permissionOverrides: overrides as object },
  });

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null };
}

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/** Create a pending user and email an invite link (no password until they accept). */
export async function sendUserInvite(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Unauthorized" };

  const myRole = session.user.role as Role;
  if (!canCreateUser(myRole)) return { error: "Forbidden" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleInput = String(formData.get("role") ?? "").trim();
  const role = roleInput as Role;
  const initialYachtId = String(formData.get("initialYachtId") ?? "").trim();

  if (!name || !email || !role) return { error: "Missing fields" };

  const allowedRoles: Role[] =
    myRole === "ADMIN" ? ["ADMIN", "MANAGER", "TECHNICIAN"] : ["MANAGER", "TECHNICIAN"];
  if (!allowedRoles.includes(role)) return { error: "Invalid role for your account" };

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
      inviteToken,
      inviteTokenExpiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
    },
    select: { id: true },
  });

  if (initialYachtId && canAssignYacht(myRole)) {
    const yacht = await prisma.yacht.findUnique({
      where: { id: initialYachtId },
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
    return { error: mail.error };
  }

  revalidatePath("/admin/users");
  revalidatePath("/crew");
  return { error: null, devInviteUrl: mail.devInviteUrl };
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