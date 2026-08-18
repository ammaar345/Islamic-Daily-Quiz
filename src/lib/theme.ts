"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** User theme preference. Defaults to following the OS. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
    }),
    { name: "idq-theme-v1" },
  ),
);

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Toggle the `.dark` class on <html>. Must only run on the client. */
export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolveTheme(mode) === "dark");
}

/** Inline head script: applies the stored/system theme before first paint,
 *  avoiding a light-flash for dark-mode users. */
export const THEME_BOOTSTRAP = `(function(){try{var s=JSON.parse(localStorage.getItem("idq-theme-v1")||"{}");var m=s.state&&s.state.mode||"system";var d=m==="dark"||(m!=="light"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;
