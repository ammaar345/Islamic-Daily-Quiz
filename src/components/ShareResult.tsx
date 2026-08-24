"use client";

import { useCallback, useRef, useState } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { Button } from "./ui/Button";

/**
 * Share (or copy) today's result. Uses the native share sheet where
 * available; falls back to copying the text to the clipboard.
 */
export function ShareResult({
  score,
  total,
  streak,
}: {
  score: number;
  total: number;
  streak: number;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const text =
    `I scored ${score}/${total} on today's ${SITE_NAME}` +
    (streak > 1 ? ` — ${streak}-day streak.` : ".") +
    ` A daily quiz on Quran, Hadith and Seerah: ${SITE_URL}`;

  const onClick = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: SITE_NAME, text });
        return;
      } catch {
        // User dismissed the sheet, or sharing failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable (permissions / insecure context) — no-op */
    }
  }, [text]);

  return (
    <Button variant="outline" className="w-full" onClick={onClick}>
      {copied ? "Copied to clipboard" : "Share your score"}
    </Button>
  );
}
