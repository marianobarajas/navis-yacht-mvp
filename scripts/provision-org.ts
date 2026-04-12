/**
 * New customer onboarding: creates Organization + first ADMIN user.
 *
 * Easiest for a new project owner:
 *
 *   npm run provision-org
 *
 * (Interactive prompts. Uses DATABASE_URL from .env.)
 *
 * Non-interactive options:
 *
 *   ORG_NAME="..." ADMIN_EMAIL="..." ADMIN_NAME="..." [ADMIN_PASSWORD="..."] npm run provision-org
 *   (ADMIN_PASSWORD optional — a temporary password is generated and emailed when omitted.)
 *
 *   npx tsx scripts/provision-org.ts "<company>" <email> "<admin name>" "<password>" [slug]
 */
import "dotenv/config";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { provisionOrganization } from "../src/actions/organizations";
import { prisma } from "../src/lib/db";

function trim(s: string) {
  return s.trim();
}

async function promptInteractive(): Promise<{
  companyName: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  slug?: string;
}> {
  const rl = readline.createInterface({ input, output });

  console.log(`
┌─────────────────────────────────────────────────────────────┐
│  New organization (customer tenant)                           │
│  Creates the company record + one ADMIN who can log in.       │
│  Requires DATABASE_URL in .env (same DB as the app).         │
└─────────────────────────────────────────────────────────────┘
`);

  const companyName = trim(await rl.question("Company / fleet name: "));
  const adminEmail = trim(await rl.question("Admin email (login): "));
  const adminName = trim(await rl.question("Admin full name: "));

  let adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (!adminPassword) {
    console.log(
      "\nTip: set ADMIN_PASSWORD in the environment to avoid typing the password here.\n"
    );
    const pw1 = await rl.question("Admin password (min 8 characters): ");
    const pw2 = await rl.question("Confirm password: ");
    if (pw1 !== pw2) {
      await rl.close();
      throw new Error("Passwords do not match.");
    }
    adminPassword = pw1;
  }

  const slugRaw = trim(await rl.question("URL slug (optional, Enter = auto from company name): "));
  await rl.close();

  return {
    companyName,
    adminEmail,
    adminName,
    adminPassword,
    slug: slugRaw || undefined,
  };
}

async function main() {
  const fromEnv = process.env.ORG_NAME && process.env.ADMIN_EMAIL && process.env.ADMIN_NAME;

  let companyName: string;
  let adminEmail: string;
  let adminName: string;
  let adminPassword: string | undefined;
  let slug: string | undefined;

  if (fromEnv) {
    companyName = process.env.ORG_NAME!.trim();
    adminEmail = process.env.ADMIN_EMAIL!.trim();
    adminName = process.env.ADMIN_NAME!.trim();
    adminPassword = process.env.ADMIN_PASSWORD?.trim() || undefined;
    slug = process.env.ORG_SLUG?.trim() || undefined;
  } else {
    const [, , a, b, c, d, e] = process.argv;
    if (a && b && c) {
      companyName = a;
      adminEmail = b;
      adminName = c;
      adminPassword = d?.trim() || undefined;
      slug = e?.trim() || undefined;
    } else {
      const answers = await promptInteractive();
      companyName = answers.companyName;
      adminEmail = answers.adminEmail;
      adminName = answers.adminName;
      adminPassword = answers.adminPassword;
      slug = answers.slug;
    }
  }

  if (!companyName || !adminEmail || !adminName) {
    console.error("Missing required fields.");
    process.exit(1);
  }

  const result = await provisionOrganization({
    companyName,
    adminEmail,
    adminName,
    adminPassword,
    slug,
  });

  if (result.error) {
    console.error("Failed:", result.error);
    process.exit(1);
  }

  console.log("\nDone.");
  console.log("  Organization slug:", result.slug);
  console.log("  Admin signs in at /signin with:", adminEmail);
  if ("emailError" in result && result.emailError) {
    console.warn("  Email warning:", result.emailError);
  }
  if ("devEmailSkipped" in result && result.devEmailSkipped) {
    console.warn("  Dev: welcome email skipped — see server logs for temporary password.");
  }
  console.log("  Next: log in as that admin, then add yachts and invite crew.\n");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
