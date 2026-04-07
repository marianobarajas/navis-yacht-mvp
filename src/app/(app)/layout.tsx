import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNotificationsForCurrentUser } from "@/actions/notifications";
import { TopNav } from "@/components/TopNav";
import { MainTabs } from "@/components/MainTabs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const notificationsResult =
    session?.user ? await getNotificationsForCurrentUser() : { data: null };
  const notifications =
    notificationsResult.data ?? [];

  return (
    <div className="min-h-screen bg-[var(--apple-bg)]">
      <header className="fixed left-0 right-0 top-0 z-40 flex w-full flex-col">
        <TopNav
          user={session?.user ?? { name: null, email: null }}
          notifications={notifications}
        />
        <MainTabs />
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-12 pt-[calc(var(--app-header-offset)+1.5rem)] sm:px-8 sm:pt-[calc(var(--app-header-offset)+2rem)] lg:px-12">
        {children}
      </main>
    </div>
  );
}
