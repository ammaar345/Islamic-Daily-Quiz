"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the app can be installed and opened offline.
 * Production only — SW registration is a no-op in dev.
 */
export function PWAInit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
