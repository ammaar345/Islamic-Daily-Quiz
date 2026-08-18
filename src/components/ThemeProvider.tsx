"use client";

import { useEffect } from "react";
import { useThemeStore, applyTheme } from "@/lib/theme";

/**
 * Applies the current theme to <html> and follows OS changes while in
 * "system" mode. Pairs with the THEME_BOOTSTRAP inline script (which runs
 * before paint) — this keeps the class correct after hydration.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    applyTheme(mode);
    if (mode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  return <>{children}</>;
}
