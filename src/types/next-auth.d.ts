import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MANAGER" | "TECHNICIAN";
      /** Tenant scope; omitted for platform-only accounts. */
      organizationId?: string;
      isPlatformAdmin?: boolean;
      profileImage?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "MANAGER" | "TECHNICIAN";
    organizationId?: string | null;
    isPlatformAdmin?: boolean;
    profileImage?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "MANAGER" | "TECHNICIAN";
    organizationId?: string;
    isPlatformAdmin?: boolean;
    profileImage?: string | null;
  }
}
