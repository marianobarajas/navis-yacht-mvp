import NextAuth, { DefaultSession } from "next-auth";

/** Legacy JWT value before Role enum migration; treat as Captain everywhere. */
type FleetRole =
  | "ADMIN"
  | "CAPTAIN"
  | "CHIEF_ENGINEER"
  | "FIRST_MATE"
  | "BOSUN"
  | "DECKHAND_1"
  | "DECKHAND_2"
  | "CHEF"
  | "CHIEF_STEWARDESS"
  | "STEWARDESS_1"
  | "STEWARDESS_2";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: FleetRole;
      /** Tenant scope; omitted for platform-only accounts. */
      organizationId?: string;
      isPlatformAdmin?: boolean;
      profileImage?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: FleetRole;
    organizationId?: string | null;
    isPlatformAdmin?: boolean;
    profileImage?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: FleetRole;
    organizationId?: string;
    isPlatformAdmin?: boolean;
    profileImage?: string | null;
  }
}
