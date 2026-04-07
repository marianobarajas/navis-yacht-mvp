import Link from "next/link";
import { AcceptInviteForm } from "./AcceptInviteForm";

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--signin-bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-[var(--apple-radius-xl)] border border-white/10 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="text-xl font-bold tracking-[0.15em] text-[var(--palette-peacock)]">NAVIS</div>
          <h1 className="mt-4 text-xl font-semibold text-[var(--apple-text-primary)]">Accept your invite</h1>
          <p className="mt-2 text-sm text-[var(--apple-text-tertiary)]">Choose a password to activate your account.</p>
        </div>
        <AcceptInviteForm />
        <p className="mt-6 text-center text-sm text-[var(--apple-text-tertiary)]">
          <Link href="/signin" className="text-[var(--apple-accent)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
