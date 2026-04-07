/**
 * Onboarding helper for a **new** customer (not a Server Action — import from scripts/API routes only).
 * New Organization + first ADMIN user. Run via `npx tsx scripts/provision-org.ts` or internal admin API.
 */
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

function slugify(name: string) {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s || `org-${Date.now()}`;
}

export async function provisionOrganization(input: {
  companyName: string;
  slug?: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}) {
  const name = input.companyName.trim();
  const email = input.adminEmail.toLowerCase().trim();
  const adminName = input.adminName.trim();
  const pw = input.adminPassword;
  if (!name || !email || !adminName || !pw || pw.length < 8) {
    return { error: "Invalid input: need company name, admin name/email, password (min 8 chars)." };
  }

  let slug = input.slug?.trim() || slugify(name);
  const existingSlug = await prisma.organization.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { error: "That email is already registered." };
  }

  const passwordHash = await hash(pw, 10);

  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name, slug },
    });
    await tx.user.create({
      data: {
        name: adminName,
        email,
        passwordHash,
        role: "ADMIN",
        organizationId: org.id,
        isPlatformAdmin: false,
      },
    });
  });

  return { error: null, slug };
}
