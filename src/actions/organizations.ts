/**
 * Onboarding helper for a **new** customer (not a Server Action — import from scripts/API routes only).
 * New Organization + first ADMIN user. Run via `npx tsx scripts/provision-org.ts` or internal admin API.
 */
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendTenantWelcomeEmail } from "@/lib/mail";

function generateInitialAdminPassword() {
  const part = randomBytes(12).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  return `Navis-${part}`;
}

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
  /** If omitted, a strong temporary password is generated and emailed (when mail is configured). */
  adminPassword?: string;
}) {
  const name = input.companyName.trim();
  const email = input.adminEmail.toLowerCase().trim();
  const adminName = input.adminName.trim();
  const pw = (input.adminPassword?.trim() || generateInitialAdminPassword()) as string;
  if (!name || !email || !adminName || pw.length < 8) {
    return { error: "Invalid input: need company name, admin name, and valid email." };
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
        role: "CAPTAIN",
        organizationId: org.id,
        isPlatformAdmin: false,
      },
    });
  });

  const mail = await sendTenantWelcomeEmail({
    to: email,
    name: adminName,
    companyName: name,
    email,
    temporaryPassword: pw,
  });

  return {
    error: null as null,
    slug,
    emailError: mail.error ?? undefined,
    devEmailSkipped: mail.devSkipped === true,
  };
}
