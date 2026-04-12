"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function dismissAppTour() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" as const };
  if (session.user.isPlatformAdmin) {
    return { error: null };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { appTourCompletedAt: new Date() },
  });

  revalidatePath("/dashboard");
  return { error: null };
}
