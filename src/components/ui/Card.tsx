import Link from "next/link";

interface DashboardCardProps {
  title: string;
  metric?: React.ReactNode;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardCard({
  title,
  metric,
  subtitle,
  actionLabel,
  actionHref,
  icon,
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-[var(--apple-radius)] border border-[var(--apple-border)] bg-[var(--apple-bg-elevated)] p-5 shadow-[var(--apple-shadow-sm)] transition-all duration-200 hover:shadow-[var(--apple-shadow)] hover:border-[var(--apple-border-strong)] ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--apple-radius-sm)] bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]">
              {icon}
            </span>
          )}
          <h3 className="text-sm font-medium text-[var(--apple-text-secondary)]">
            {title}
          </h3>
        </div>
      </div>
      {metric !== undefined && (
        <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--apple-text-primary)]">
          {metric}
        </p>
      )}
      {subtitle && (
        <p className="mt-0.5 text-xs text-[var(--apple-text-tertiary)]">
          {subtitle}
        </p>
      )}
      {children}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-block text-sm font-medium text-[var(--apple-accent)] transition-colors hover:text-[var(--apple-accent-hover)]"
        >
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}
