import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserProfile } from "@/actions/users";
import { ProfileView, type Profile } from "./ProfileView";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");

  const res = await getCurrentUserProfile();
  if (res.error || !res.data) redirect("/dashboard");

  return (
    <div className="mx-auto flex max-h-[calc(100vh-8.5rem)] max-w-5xl flex-col overflow-hidden">
      <div className="mb-3 shrink-0">
        <h1 className="text-2xl font-bold text-[var(--apple-text-primary)]">My profile</h1>
        <p className="mt-0.5 text-sm text-[var(--apple-text-tertiary)]">View and edit your info, permissions, and assigned yachts.</p>
      </div>
      <div className="min-h-0 flex-1">
        <ProfileView profile={res.data as Profile} />
      </div>
    </div>
  );
}
