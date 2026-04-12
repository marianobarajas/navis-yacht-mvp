import { normalizeYachtIconVariant } from "@/lib/yachtIconVariant";

const common = {
  xmlns: "http://www.w3.org/2000/svg" as const,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.65,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Six small yacht silhouettes — assigned per yacht via `iconVariant` */
export function YachtSilhouetteIcon({
  variant,
  className = "h-6 w-6",
  "aria-hidden": ariaHidden = true,
}: {
  variant: number;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  const v = normalizeYachtIconVariant(variant);

  switch (v) {
    case 0:
      return (
        <svg {...common} className={className} aria-hidden={ariaHidden}>
          <path d="M4 18c2-2.5 5-3.5 8-3.5s6 1 8 3.5" />
          <path d="M3.5 18.5h17" />
          <path d="M12 5v9.5" />
          <path d="M12 6.5L8 13h8L12 6.5z" />
        </svg>
      );
    case 1:
      return (
        <svg {...common} className={className} aria-hidden={ariaHidden}>
          <path d="M3 17.5c2-1.5 5.5-2.5 9-2.5s7 1 9 2.5" />
          <path d="M3 18h18" />
          <path d="M8 17V11h5v6" />
          <path d="M13 12h3.5l1.5 2v3" />
        </svg>
      );
    case 2:
      return (
        <svg {...common} className={className} aria-hidden={ariaHidden}>
          <path d="M5 18.5a2.2 3 0 004.2 0" />
          <path d="M14.8 18.5a2.2 3 0 004.2 0" />
          <path d="M7.5 18.5h9" />
          <path d="M10 18.5V14h4v4.5" />
          <path d="M9 14h6" />
        </svg>
      );
    case 3:
      return (
        <svg {...common} className={className} aria-hidden={ariaHidden}>
          <path d="M4 18c2-2 5-3 8-3s6 1 8 3" />
          <path d="M3.5 18.5h17" />
          <path d="M10 5v7" />
          <path d="M10 5.5L7 11.5h3V5.5z" />
          <path d="M15 8v6" />
          <path d="M15 8l-2 4.5h4L15 8z" />
        </svg>
      );
    case 4:
      return (
        <svg {...common} className={className} aria-hidden={ariaHidden}>
          <path d="M4 17.5L6 14h12l2 3.5" />
          <path d="M5 18h14" />
          <path d="M9 14V12h6v2" />
          <path d="M11 12V10h2v2" />
        </svg>
      );
    case 5:
      return (
        <svg {...common} className={className} aria-hidden={ariaHidden}>
          <path d="M3.5 18c2-2.2 5-3.5 8.5-3.5S19.5 15.8 21.5 18" />
          <path d="M3 18.5h18" />
          <path d="M12 4.5v10" />
          <path d="M12 5.5L7.5 13h9L12 5.5z" />
          <path d="M8 13.5h8" />
        </svg>
      );
    default:
      return (
        <svg {...common} className={className} aria-hidden={ariaHidden}>
          <path d="M4 18c2-2.5 5-3.5 8-3.5s6 1 8 3.5" />
        </svg>
      );
  }
}
