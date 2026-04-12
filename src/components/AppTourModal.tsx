"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { dismissAppTour } from "@/actions/onboarding";

const STEPS = [
  {
    title: "Top bar",
    body: "Your logo and fleet name are on the left; notifications and your profile menu are on the right.",
  },
  {
    title: "Tabs",
    body: "Use Home, Calendar, Tasks, Yachts, Expenses, and Crew to move between the main areas of Navis.",
  },
  {
    title: "Dashboard",
    body: "Here you see quick stats, a calendar preview, tasks, crew, and expense totals. Tap any card to go to that area.",
  },
  {
    title: "Day to day",
    body: "Create and assign tasks under Tasks; open a yacht for logs and work orders; record spending under Expenses; manage people under Crew.",
  },
  {
    title: "You are set",
    body: "You can reopen sections from the tabs anytime. When you are ready, continue to your dashboard.",
  },
];

export function AppTourModal() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const last = step >= STEPS.length - 1;

  function finish() {
    setErr(null);
    startTransition(async () => {
      const res = await dismissAppTour();
      if (res.error) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  const s = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--apple-radius-xl)] border border-white/25 bg-slate-950/95 p-6 text-slate-100 shadow-2xl ring-1 ring-white/15 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Quick tour · {step + 1} / {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-2 text-xl font-semibold text-white">
          {s.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{s.body}</p>
        {err ? <p className="mt-3 text-sm text-red-300">{err}</p> : null}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          {step > 0 ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStep((x) => Math.max(0, x - 1))}
              className="rounded-[var(--apple-radius)] border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Back
            </button>
          ) : null}
          {!last ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStep((x) => x + 1)}
              className="rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={finish}
              className="rounded-[var(--apple-radius)] bg-[var(--apple-accent)] px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--apple-accent-hover)] disabled:opacity-50"
            >
              {pending ? "Saving…" : "Got it — go to dashboard"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
