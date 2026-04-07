import type { CSSProperties } from "react";
import { coverPatternIndexFromYachtId, type CoverPatternIndex } from "@/lib/yachtCoverPattern";

/** Repeating horizontal wave using Q/T smooth curves */
function rippleLine(baseY: number, amp: number) {
  return `M0 ${baseY} Q 100 ${baseY - amp} 200 ${baseY} T 400 ${baseY} T 600 ${baseY} T 800 ${baseY} T 1000 ${baseY} T 1200 ${baseY}`;
}

type InnerProps = {
  className: string;
  pattern: CoverPatternIndex;
};

/** 0 — Horizon swell: classic layered waves + bottom swell */
function PatternHorizon({ className }: { className: string }) {
  const oceanStyle: CSSProperties = {
    background: `linear-gradient(180deg, #e8f4f7 0%, #c5dde6 28%, #8fb9c6 62%, #5a8f9a 100%)`,
  };
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={oceanStyle} aria-hidden>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 95% 55% at 50% -5%, rgba(255, 255, 255, 0.55), transparent 52%)",
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(0,0)">
          <path fill="none" stroke="rgba(30, 74, 82, 0.14)" strokeWidth="1.25" strokeLinecap="round" d={rippleLine(52, 6)} />
        </g>
        <g transform="translate(45,0)">
          <path fill="none" stroke="rgba(30, 74, 82, 0.11)" strokeWidth="1" strokeLinecap="round" d={rippleLine(88, 5)} />
        </g>
        <g transform="translate(-28,0)">
          <path fill="none" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.1" strokeLinecap="round" d={rippleLine(118, 4)} />
        </g>
        <g transform="translate(72,0)">
          <path fill="none" stroke="rgba(30, 74, 82, 0.12)" strokeWidth="1.15" strokeLinecap="round" d={rippleLine(158, 7)} />
        </g>
        <g transform="translate(-55,0)">
          <path fill="none" stroke="rgba(90, 143, 143, 0.35)" strokeWidth="1" strokeLinecap="round" d={rippleLine(198, 5)} />
        </g>
      </svg>
      <svg
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[45%] min-h-[72px]"
        viewBox="0 0 1200 140"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="rgba(30, 74, 82, 0.09)" d="M0,55 Q200,35 400,50 T800,45 T1200,52 L1200,140 L0,140 Z" />
        <path fill="rgba(255, 255, 255, 0.12)" d="M0,75 Q300,60 600,72 T1200,68 L1200,140 L0,140 Z" />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 11px, rgba(255, 255, 255, 0.04) 11px, rgba(255, 255, 255, 0.04) 12px)`,
        }}
      />
    </div>
  );
}

/** 1 — Shallow lagoon: bright cyan, soft ripples, foam specks */
function PatternLagoon({ className }: { className: string }) {
  const bg: CSSProperties = {
    background: `linear-gradient(185deg, #f0fbfd 0%, #b8e6ef 38%, #6ec4d6 78%, #4a9eb0 100%)`,
  };
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={bg} aria-hidden>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 30% 10%, rgba(255,255,255,0.65), transparent 50%)",
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" d={rippleLine(70, 4)} />
        <path fill="none" stroke="rgba(30,74,82,0.1)" strokeWidth="1" strokeLinecap="round" d={rippleLine(110, 5)} transform="translate(60,0)" />
        <path fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" strokeLinecap="round" d={rippleLine(150, 3)} transform="translate(-40,0)" />
        <path fill="none" stroke="rgba(30,74,82,0.08)" strokeWidth="1.1" strokeLinecap="round" d={rippleLine(210, 6)} transform="translate(20,0)" />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.35) 0.5px, transparent 0.5px),
            radial-gradient(circle at 70% 55%, rgba(255,255,255,0.25) 0.5px, transparent 0.5px),
            radial-gradient(circle at 45% 75%, rgba(255,255,255,0.2) 0.5px, transparent 0.5px)`,
          backgroundSize: "48px 52px, 62px 58px, 55px 60px",
        }}
      />
    </div>
  );
}

/** 2 — Deep channel: darker water, moonlit surface, slow rollers */
function PatternDeep({ className }: { className: string }) {
  const bg: CSSProperties = {
    background: `linear-gradient(180deg, #2a4a58 0%, #1e3d4a 35%, #152f3c 70%, #0f2630 100%)`,
  };
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={bg} aria-hidden>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 45% at 75% 0%, rgba(184, 203, 212, 0.25), transparent 55%)",
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="none" stroke="rgba(200, 220, 230, 0.12)" strokeWidth="1.4" strokeLinecap="round" d={rippleLine(65, 8)} />
        <path fill="none" stroke="rgba(90, 143, 143, 0.25)" strokeWidth="1" strokeLinecap="round" d={rippleLine(130, 6)} transform="translate(90,0)" />
        <path fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" strokeLinecap="round" d={rippleLine(190, 7)} transform="translate(-50,0)" />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[38%] min-h-[64px]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="rgba(0,0,0,0.15)" d="M0,40 Q400,20 800,35 T1200,30 L1200,120 L0,120 Z" />
      </svg>
    </div>
  );
}

/** 3 — Coastal wake: diagonal swell lines + cross-chop */
function PatternWake({ className }: { className: string }) {
  const bg: CSSProperties = {
    background: `linear-gradient(125deg, #e2f0f4 0%, #b0cfd9 45%, #7aa8b5 100%)`,
  };
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={bg} aria-hidden>
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              -32deg,
              transparent,
              transparent 14px,
              rgba(30, 74, 82, 0.06) 14px,
              rgba(30, 74, 82, 0.06) 15px
            ),
            repeating-linear-gradient(
              18deg,
              transparent,
              transparent 22px,
              rgba(255, 255, 255, 0.12) 22px,
              rgba(255, 255, 255, 0.12) 23px
            )
          `,
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="none" stroke="rgba(30,74,82,0.13)" strokeWidth="1.15" strokeLinecap="round" d={rippleLine(95, 5)} />
        <path fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round" d={rippleLine(175, 6)} transform="translate(100,0)" />
      </svg>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 35%)",
        }}
      />
    </div>
  );
}

/** 4 — Concentric ripples: drop-in-water rings + soft pool gradient */
function PatternRipples({ className }: { className: string }) {
  const bg: CSSProperties = {
    background: `
      radial-gradient(ellipse 90% 70% at 50% 42%, #c8e8ee 0%, #7eb8c8 55%, #4d8796 100%)
    `,
  };
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={bg} aria-hidden>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.45) 0%, transparent 45%)",
        }}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="600" cy="125" rx="90" ry="42" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
        <ellipse cx="600" cy="125" rx="160" ry="72" fill="none" stroke="rgba(30,74,82,0.1)" strokeWidth="1" />
        <ellipse cx="600" cy="125" rx="240" ry="108" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9" />
        <ellipse cx="600" cy="125" rx="340" ry="145" fill="none" stroke="rgba(30,74,82,0.08)" strokeWidth="0.85" />
        <ellipse cx="600" cy="125" rx="460" ry="195" fill="none" stroke="rgba(90,143,143,0.12)" strokeWidth="0.75" />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[35%] min-h-[56px]"
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="rgba(30,74,82,0.06)" d="M0,35 Q600,15 1200,40 L1200,100 L0,100 Z" />
      </svg>
    </div>
  );
}

function PlaceholderByPattern({ pattern, className }: InnerProps) {
  switch (pattern) {
    case 0:
      return <PatternHorizon className={className} />;
    case 1:
      return <PatternLagoon className={className} />;
    case 2:
      return <PatternDeep className={className} />;
    case 3:
      return <PatternWake className={className} />;
    case 4:
      return <PatternRipples className={className} />;
    default:
      return <PatternHorizon className={className} />;
  }
}

type Props = {
  /** Yacht id — used to pick a stable pseudo-random pattern when there is no cover photo. */
  yachtId: string;
  className?: string;
};

export function YachtCoverPlaceholder({ yachtId, className = "" }: Props) {
  const pattern = coverPatternIndexFromYachtId(yachtId);
  return <PlaceholderByPattern pattern={pattern} className={className} />;
}

/** For tests or forcing a variant — prefer `YachtCoverPlaceholder` with `yachtId` in app code. */
export function YachtCoverPlaceholderByPattern({
  pattern,
  className = "",
}: {
  pattern: CoverPatternIndex;
  className?: string;
}) {
  return <PlaceholderByPattern pattern={pattern} className={className} />;
}
