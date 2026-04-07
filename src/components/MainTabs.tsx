"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

const tabs: { label: string; href: string; icon: "home" | "calendar" | "tasks" | "yachts" | "logs" | "crew" }[] = [
  { label: "Home", href: "/dashboard", icon: "home" },
  { label: "Calendar", href: "/calendar", icon: "calendar" },
  { label: "Tasks", href: "/tasks", icon: "tasks" },
  { label: "Yachts", href: "/yachts", icon: "yachts" },
  { label: "Expenses", href: "/logs", icon: "logs" },
  { label: "Crew", href: "/crew", icon: "crew" },
];

function TabIcon({ name, active }: { name: (typeof tabs)[0]["icon"]; active: boolean }) {
  const className = "h-4 w-4 shrink-0";
  const stroke = active ? "currentColor" : "currentColor";
  switch (name) {
    case "home":
      return (
        <svg className={className} fill="none" stroke={stroke} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={className} fill="none" stroke={stroke} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "tasks":
      return (
        <svg className={className} fill="none" stroke={stroke} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case "yachts":
      return (
        <svg className={className} fill="none" stroke={stroke} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case "logs":
      return (
        <svg className={className} fill="none" stroke={stroke} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "crew":
      return (
        <svg className={className} fill="none" stroke={stroke} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    default:
      return null;
  }
}

/** Sliding underline (idea 3) — animated left/width */
type UnderlineIndicator = { left: number; width: number; opacity: number };

export function MainTabs() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [underline, setUnderline] = useState<UnderlineIndicator>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const activeIndex = tabs.findIndex((tab) =>
    tab.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === tab.href || pathname.startsWith(tab.href + "/")
  );

  useLayoutEffect(() => {
    function update() {
      const nav = navRef.current;
      const el = activeIndex >= 0 ? tabRefs.current[activeIndex] : null;
      if (!nav || !el) {
        setUnderline((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setUnderline({
        left: elRect.left - navRect.left + nav.scrollLeft,
        width: elRect.width,
        opacity: 1,
      });
    }

    update();
    const nav = navRef.current;
    const ro = new ResizeObserver(update);
    if (nav) ro.observe(nav);
    window.addEventListener("resize", update);
    nav?.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      nav?.removeEventListener("scroll", update);
    };
  }, [activeIndex, pathname]);

  const isDashboard = pathname === "/dashboard";

  return (
    <nav
      className={`w-full shrink-0 border-b bg-[var(--apple-nav-tabs-bg)] ${
        isDashboard ? "border-b-transparent" : "border-b-[var(--apple-border)]"
      }`}
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={navRef}
          className="scrollbar-hide relative flex min-h-0 min-w-0 gap-1 overflow-x-auto overflow-y-hidden sm:gap-2"
        >
          <span
            className="pointer-events-none absolute bottom-0 z-0 h-[3px] rounded-full bg-[var(--apple-accent)] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            style={{
              left: underline.left,
              width: underline.width,
              opacity: underline.opacity,
            }}
            aria-hidden
          />
          {tabs.map((tab, i) => {
            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                href={tab.href}
                className={`relative z-10 flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition-colors duration-200 sm:px-4 ${
                  isActive
                    ? "font-semibold text-[var(--apple-accent)]"
                    : "text-[var(--apple-text-primary)] hover:text-[var(--apple-accent)]"
                }`}
              >
                <TabIcon name={tab.icon} active={isActive} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
