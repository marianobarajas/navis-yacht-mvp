import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--apple-accent)] text-white hover:bg-[var(--apple-accent-hover)] border-transparent active:scale-[0.98]",
  secondary:
    "bg-[var(--apple-bg-elevated)] text-[var(--apple-text-primary)] border-[var(--apple-border-strong)] hover:bg-[var(--apple-bg-subtle)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--apple-text-secondary)] border-transparent hover:bg-[var(--apple-accent-muted)] hover:text-[var(--apple-accent)] active:scale-[0.98]",
  destructive:
    "bg-[var(--accent-urgent)] text-white border-transparent hover:bg-[var(--accent-urgent-hover)] active:scale-[0.98]",
};

export function Button({
  children,
  variant = "primary",
  href,
  type = "button",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  href?: string;
  type?: "button" | "submit";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--apple-radius)] border px-6 py-3 text-base font-medium min-h-[46px] transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] " +
    variants[variant] +
    " " +
    className;

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={base} {...props}>
      {children}
    </button>
  );
}
