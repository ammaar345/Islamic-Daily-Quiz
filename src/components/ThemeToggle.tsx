"use client";

import { useThemeStore, resolveTheme, type ThemeMode } from "@/lib/theme";

const MODES: ThemeMode[] = ["light", "dark", "system"];

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4.5" />
      <path
        d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round" />
    </svg>
  );
}

/** Cycles light → dark → system. Icon reflects the effective theme. */
export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const effective = resolveTheme(mode);
  const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      title={`Theme: ${mode}. Click to switch to ${next}.`}
      aria-label={`Theme: ${mode}. Click to switch to ${next}.`}
      className="cursor-pointer rounded-full p-2 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
    >
      {effective === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
