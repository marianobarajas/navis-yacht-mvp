"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import Image from "next/image";

function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("/api")) return "/dashboard";
  if (raw.startsWith("/_next")) return "/dashboard";
  return raw;
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(params.get("callbackUrl"));

  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showPassword) passwordInputRef.current?.focus();
  }, [showPassword]);

  function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setShowPassword(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res || res.error) {
        setError("Invalid credentials");
        return;
      }

      const safeNext =
        res.url && res.url.startsWith("/") && !res.url.startsWith("/api")
          ? res.url
          : callbackUrl;

      router.push(safeNext);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={showPassword ? onSubmit : onEmailSubmit}
      className="grid gap-5"
    >
      <div className="grid gap-2">
        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
          Email
        </label>
        <input
          className="apple-input w-full px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
          readOnly={showPassword}
          style={showPassword ? { opacity: 0.9 } : undefined}
        />
      </div>

      <div
        className="grid gap-2 overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
        style={{
          maxHeight: showPassword ? 200 : 0,
          opacity: showPassword ? 1 : 0,
          marginTop: showPassword ? 4 : 0,
        }}
      >
        <label className="text-sm font-medium text-[var(--apple-text-secondary)]">
          Password
        </label>
        <input
          ref={passwordInputRef}
          className="apple-input w-full px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required={showPassword}
        />
      </div>

      {error ? (
        <div
          className="rounded-[var(--apple-radius-sm)] bg-[var(--ocean-coral-muted)] px-3 py-2 text-sm text-[var(--accent-urgent)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="flex gap-3">
        {showPassword && (
          <button
            type="button"
            onClick={() => {
              setShowPassword(false);
              setPassword("");
              setError(null);
            }}
            className="rounded-[var(--apple-radius)] border border-[var(--apple-border-strong)] bg-[var(--apple-bg-elevated)] px-4 py-3 text-sm font-medium text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)]"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="apple-btn-primary flex-1 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Signing in..."
            : showPassword
              ? "Sign in"
              : "Continue"}
        </button>
      </div>
    </form>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left: Image */}
      <div className="relative hidden w-[45%] shrink-0 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&q=80"
          alt="Ocean and horizon"
          fill
          className="object-cover"
          priority
          sizes="45vw"
        />
      </div>

      {/* Right: Form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--signin-bg)] px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <div className="mb-8 flex justify-center">
              <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
                <Image
                  src="/navis-logo.jpg"
                  alt="NAVIS"
                  width={1024}
                  height={370}
                  className="mx-auto h-16 w-auto max-w-[min(90vw,26rem)] object-contain sm:h-[4.5rem]"
                  priority
                />
              </div>
            </div>
            <h1 className="sr-only">NAVIS</h1>
            <p className="mt-2 text-center text-base text-white/80">
              Sign in to your account
            </p>
          </div>

          <div className="rounded-[var(--apple-radius-xl)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-10 shadow-[var(--apple-shadow-lg)] min-h-[320px] flex flex-col">
            <h2 className="mb-8 text-xl font-semibold text-[var(--apple-text-primary)]">
              Sign in
            </h2>
            <Suspense
              fallback={
                <div className="h-48 animate-pulse rounded-[var(--apple-radius)] bg-[var(--apple-bg-subtle)]" />
              }
            >
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
