"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { markNotificationRead } from "@/actions/notifications";

export type NavNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  link?: string;
};

export function TopNav({
  user,
  notifications = [],
}: {
  user: { name?: string | null; email?: string | null; profileImage?: string | null };
  notifications?: NavNotification[];
}) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabel = (user as { role?: string })?.role === "ADMIN" ? "Admin" : (user as { role?: string })?.role === "MANAGER" ? "Manager" : (user as { role?: string })?.role === "TECHNICIAN" ? "Technician" : "User";
  const profileImage = user?.profileImage ?? null;

  async function handleNotificationClick(n: NavNotification) {
    setNotificationsOpen(false);
    if (n.link) router.push(n.link);
    if (!n.id.startsWith("due-today-")) markNotificationRead(n.id);
  }

  return (
    <div className="shrink-0 border-b border-[var(--apple-border-strong)] bg-white shadow-[0_2px_12px_rgba(26,61,74,0.08)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
      <div className="flex items-center gap-8">
        <Link
          href="/dashboard"
          className="flex items-center transition-opacity hover:opacity-90"
          title="NAVIS"
        >
          <Image
            src="/navis-logo.jpg"
            alt="NAVIS"
            width={1024}
            height={370}
            className="h-12 w-auto max-w-[min(100vw-12rem,22rem)] object-contain object-left sm:h-[3.35rem]"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell – right side, next to user status */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((o) => !o);
              if (userMenuOpen) setUserMenuOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            className="relative rounded-lg p-2.5 text-[var(--apple-text-secondary)] transition-colors hover:bg-[var(--apple-bg-subtle)] hover:text-[var(--apple-text-primary)]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.some((n) => n.unread) && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--apple-accent)]" aria-hidden />
            )}
          </button>
          {notificationsOpen && (
            <div
              className="apple-dropdown-panel absolute right-0 top-full z-50 mt-2 w-80 max-h-[min(24rem,70vh)] overflow-hidden flex flex-col"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="shrink-0 border-b border-[var(--apple-border)] px-4 py-3">
                <h3 className="text-sm font-semibold text-[var(--apple-text-primary)]">Notifications</h3>
              </div>
              <div className="min-h-0 overflow-auto py-1">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-[var(--apple-text-tertiary)]">
                    No new notifications
                  </p>
                ) : (
                  <ul className="py-1">
                    {notifications.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className="block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--apple-bg-subtle)]"
                          onClick={() => handleNotificationClick(n)}
                        >
                          <span className="font-medium text-[var(--apple-text-primary)]">{n.title}</span>
                          <span className="mt-0.5 block text-xs text-[var(--apple-text-tertiary)]">{n.body}</span>
                          <span className="mt-1 block text-xs text-[var(--apple-text-tertiary)]">{n.time}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--apple-bg-subtle)]"
        >
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--apple-text-primary)]">
              {user?.name ?? "User"}
            </p>
            <p className="text-xs text-[var(--apple-text-tertiary)]">{roleLabel}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--apple-accent)] text-sm font-semibold text-white">
            {profileImage ? (
              <img src={profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">{user?.name?.charAt(0) ?? "?"}</span>
            )}
          </div>
        </button>
        {userMenuOpen && (
          <div className="apple-dropdown-panel absolute right-0 top-full z-50 mt-2 w-56 py-1">
            <div className="border-b border-[var(--apple-border)] px-4 py-3 text-sm text-[var(--apple-text-secondary)]">
              {user?.email}
            </div>
            {(user as { role?: string })?.role !== "ADMIN" && (
              <Link
                href="/profile"
                className="block px-4 py-2.5 text-sm text-[var(--apple-text-primary)] transition-colors hover:bg-[var(--apple-bg-subtle)]"
                onClick={() => setUserMenuOpen(false)}
              >
                View Profile
              </Link>
            )}
            {((user as { role?: string })?.role === "ADMIN" ||
              (user as { role?: string })?.role === "MANAGER") && (
              <Link
                href="/admin/users"
                className="block px-4 py-2.5 text-sm text-[var(--apple-text-primary)] transition-colors hover:bg-[var(--apple-bg-subtle)]"
                onClick={() => setUserMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="block w-full px-4 py-2.5 text-left text-sm text-[var(--accent-urgent)] transition-colors hover:bg-[var(--ocean-coral-muted)]"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}
