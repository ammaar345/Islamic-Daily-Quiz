"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuizStore, useLevelInfo } from "@/lib/store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SoundToggle } from "@/components/SoundToggle";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice" },
  { href: "/quiz", label: "Daily Quiz" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const progress = useQuizStore((s) => s.progress);
  const signOut = useQuizStore((s) => s.signOut);
  const level = useLevelInfo();

  if (!progress) return null;

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-border-soft">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary-deep text-lg text-gold-soft">
              ✦
            </span>
            <span className="hidden font-display text-lg font-bold text-ink sm:block">
              Islamic Daily Quiz
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active ? "text-primary-deep" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-primary-soft"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-gold-soft px-3 py-1.5 text-sm font-semibold text-gold-deep md:flex">
              <span className="h-2 w-2 rounded-full bg-gold animate-glow-pulse" />
              Lv {level?.level ?? 1}
            </span>
            <span className="hidden max-w-[9rem] truncate text-sm font-medium text-ink-soft lg:block">
              {progress.name}
            </span>
            <SoundToggle />
            <ThemeToggle />
            <button
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-error"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border-soft md:hidden">
        <div className="mx-auto flex h-16 max-w-md items-stretch justify-around">
          {LINKS.map((l) => ({
            href: l.href,
            label: l.href === "/dashboard" ? "Home" : l.label,
          })).map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
                  active ? "text-primary-deep" : "text-ink-soft",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-gold" : "bg-transparent")} />
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
