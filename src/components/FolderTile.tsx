import Link from "next/link";

export function FolderTile({
  name,
  count,
  href = "/documents",
}: {
  name: string;
  count?: number;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col overflow-hidden rounded-[var(--apple-radius)] border border-[var(--apple-border)] border-l-4 border-l-[var(--palette-muted-teal)] bg-[var(--apple-bg-elevated)] p-5 shadow-[var(--apple-shadow-sm)] transition-all duration-200 hover:shadow-[var(--apple-shadow)] hover:border-[var(--apple-border-strong)]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[var(--apple-radius)] bg-[var(--apple-accent-muted)] text-[var(--apple-accent)]">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      </div>
      <span className="mt-3 text-sm font-medium text-[var(--apple-text-primary)]">
        {name}
      </span>
      {count !== undefined && (
        <span className="mt-0.5 text-xs text-[var(--apple-text-tertiary)]">
          {count} items
        </span>
      )}
    </Link>
  );
}
