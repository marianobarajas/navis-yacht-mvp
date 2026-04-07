import type { Session } from "next-auth";

export function isPlatformAdminSession(session: Session | null): boolean {
  return Boolean((session?.user as { isPlatformAdmin?: boolean } | undefined)?.isPlatformAdmin);
}
