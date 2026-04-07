import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isPlatformAdminSession } from "@/lib/platformAdmin";
import { TopNav } from "@/components/TopNav";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  if (!isPlatformAdminSession(session)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[var(--apple-bg)]">
      <header className="fixed left-0 right-0 top-0 z-40 w-full">
        <TopNav
          user={{
            ...session.user,
            name: session.user.name,
            email: session.user.email,
          }}
          notifications={[]}
          platformMode
        />
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-12 pt-[calc(var(--app-header-offset)+1.5rem)] sm:px-8 sm:pt-[calc(var(--app-header-offset)+2rem)] lg:px-12">
        {children}
      </main>
    </div>
  );
}
