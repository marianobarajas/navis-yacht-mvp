import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordHash: true,
            isActive: true,
            inviteToken: true,
            profileImage: true,
            organizationId: true,
            isPlatformAdmin: true,
          },
        });
        if (!user || !user.isActive) return null;
        if (user.inviteToken) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          organizationId: user.organizationId ?? undefined,
          isPlatformAdmin: user.isPlatformAdmin,
        };
      },
    }),
  ],
  callbacks: {
  async jwt({ token, user, trigger, session }) {
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.profileImage = user.profileImage ?? null;
      token.organizationId = (user as { organizationId?: string }).organizationId;
      token.isPlatformAdmin = Boolean((user as { isPlatformAdmin?: boolean }).isPlatformAdmin);
    }
    if (trigger === "update" && session && typeof session === "object" && "profileImage" in session) {
      token.profileImage = (session as { profileImage?: string | null }).profileImage ?? null;
    }
    // One-time backfill for JWTs issued before profileImage was stored on the token (avoids DB on every request after this).
    if (token.id && token.profileImage === undefined) {
      const row = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { profileImage: true },
      });
      token.profileImage = row?.profileImage ?? null;
    }
    if (token.id && (token.organizationId === undefined || token.isPlatformAdmin === undefined)) {
      const row = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { organizationId: true, isPlatformAdmin: true },
      });
      if (row?.organizationId) token.organizationId = row.organizationId;
      if (token.isPlatformAdmin === undefined) {
        token.isPlatformAdmin = Boolean(row?.isPlatformAdmin);
      }
    }
    // Migrate stale JWT role string after Prisma Role enum changes (e.g. ADMIN → CAPTAIN).
    if (token.id && token.role === "ADMIN") {
      const row = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { role: true },
      });
      if (row?.role) token.role = row.role;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user && token.id) {
      session.user.id = token.id as string;
      session.user.role = token.role as typeof session.user.role;
      session.user.profileImage = token.profileImage ?? null;
      if (token.organizationId) {
        session.user.organizationId = token.organizationId as string;
      } else {
        delete session.user.organizationId;
      }
      session.user.isPlatformAdmin = Boolean(token.isPlatformAdmin);
    }
    return session;
  },
}
};