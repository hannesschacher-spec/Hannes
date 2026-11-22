import type { ReactNode } from "react";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

const STYLES = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink",
};

export default function Button({ href, children, variant = "primary", className = "" }: ButtonProps) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-[0.95rem] font-medium transition-colors ${STYLES[variant]} ${className}`}
    >
      {children}
    </a>
  );
}
