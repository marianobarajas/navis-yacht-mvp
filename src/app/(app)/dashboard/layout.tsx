import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppTourModal } from "@/components/AppTourModal";

/** Full-bleed aerial background + CSS variables so dashboard widgets read in glass mode. */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isPlatform = Boolean(session?.user?.isPlatformAdmin);
  let showTour = false;
  if (userId && !isPlatform) {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { appTourCompletedAt: true },
    });
    showTour = row != null && row.appTourCompletedAt == null;
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0 bg-slate-950"
        style={{ top: "var(--app-header-offset)" }}
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/dashboard-bg.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/55" />
      </div>
      <div
        data-dashboard-page
        className="relative z-[1] pb-2 [--apple-bg-elevated:rgba(255,255,255,0.09)] [--apple-bg-muted:rgba(0,0,0,0.22)] [--apple-bg-subtle:rgba(255,255,255,0.12)] [--apple-bg-warm:rgba(255,255,255,0.06)] [--apple-border-muted:rgba(255,255,255,0.14)] [--apple-border-strong:rgba(255,255,255,0.32)] [--apple-border:rgba(255,255,255,0.2)] [--apple-dropdown-bg:rgba(30,41,59,0.92)] [--apple-text-primary:#f1f5f9] [--apple-text-secondary:rgba(241,245,249,0.85)] [--apple-text-tertiary:rgba(226,232,240,0.72)]"
      >
        {showTour ? <AppTourModal /> : null}
        {children}
      </div>
    </>
  );
}
