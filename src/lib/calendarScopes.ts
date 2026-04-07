import type { Prisma } from "@prisma/client";

/** Calendar rows visible to a tenant: yacht-linked events in the org, or org-global events (no yacht) created by org users. */
export function calendarEventOrgWhere(organizationId: string): Prisma.CalendarEventWhereInput {
  return {
    OR: [
      { yacht: { organizationId } },
      { yachtId: null, createdBy: { organizationId } },
    ],
  };
}
