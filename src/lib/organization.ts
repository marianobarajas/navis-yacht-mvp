import type { Session } from "next-auth";

/**
 * Multi-tenant scope: every signed-in user belongs to one Organization.
 * All fleet data is filtered by organizationId in server actions.
 *
 * New customers: create an Organization row + first ADMIN user (see prisma/seed or
 * `provisionOrganization` in actions/organizations.ts). Optional future: subdomain login
 * (slug) + composite email uniqueness per org.
 */
export function requireOrganizationId(session: Session | null): string | null {
  const id = (session?.user as { organizationId?: string } | undefined)?.organizationId;
  return typeof id === "string" && id.length > 0 ? id : null;
}
