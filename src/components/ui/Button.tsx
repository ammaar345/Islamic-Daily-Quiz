"use client";

import { cn } from "@/lib/cn";

type Variant = "primary" | "gold" | "ghost" | "outline";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold " +
  "transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-40 " +
  "disabled:pointer-events-none select-none cursor-pointer min-h-[44px] px-6";

const variants: Record<Variant, string> = {
  primary:
    "relative overflow-hidden rounded-full bg-gradient-to-b from-primary via-primary to-primary-deep text-white shadow-soft " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] hover:shadow-lift hover:brightness-110",
  gold: "rounded-full bg-gradient-to-b from-gold via-gold to-gold-deep text-white shadow-soft " +
    "shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] hover:shadow-amber hover:brightness-110",
  ghost: "rounded-lg bg-transparent text-ink-soft hover:text-ink hover:bg-ink/5",
  outline:
    "rounded-lg border border-ink/15 text-ink bg-surface/60 hover:border-primary hover:text-primary-dark hover:bg-primary-soft/40",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
      {variant === "primary" && (
        <span aria-hidden className="shine-sweep" />
      )}
    </button>
  );
}
