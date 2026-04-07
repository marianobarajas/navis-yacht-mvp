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
    return token;
  },
  async session({ session, token }) {
    if (session.user && token.id) {
      session.user.id = token.id as string;
      session.user.role = token.role as typeof session.user.role;
      session.user.profileImage = token.profileImage ?? null;
    }
    return session;
  },
}
};