"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPlatformAdminSession } from "@/lib/platformAdmin";
import { provisionOrganization } from "@/actions/organizations";

async function requirePlatformSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isPlatformAdminSession(session)) return null;
  return session;
}

export async function listPlatformOrganizations() {
  const session = await requirePlatformSession();
  if (!session) return { error: "Unauthorized", data: null };

  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, yachts: true } },
    },
  });

  return { error: null, data: orgs };
}

export async function listPlatformTenantUsers() {
  const session = await requirePlatformSession();
  if (!session) return { error: "Unauthorized", data: null };

  const users = await prisma.user.findMany({
    where: { isPlatformAdmin: false, organizationId: { not: null } },
    orderBy: [{ organization: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  return { error: null, data: users };
}

export async function createTenantFromPlatform(formData: FormData) {
  const session = await requirePlatformSession();
  if (!session) return { error: "Unauthorized" as const, slug: null as string | null };

  const companyName = String(formData.get("companyName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const slugRaw = String(formData.get("slug") ?? "").trim();

  const result = await provisionOrganization({
    companyName,
    adminEmail,
    adminName,
    adminPassword,
    slug: slugRaw || undefined,
  });

  if (result.error) {
    return { error: result.error, slug: null as string | null };
  }

  revalidatePath("/platform");
  return { error: null as null, slug: result.slug };
}
