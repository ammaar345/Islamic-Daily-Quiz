"use client";

import { useEffect, useRef } from "react";
import { useQuizStore } from "@/lib/store";
import { isQuizDone } from "@/lib/progress";

/** Milliseconds from now until the next HH:mm local occurrence (today or tomorrow). */
function msUntilHHmm(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/**
 * Browser-notification daily reminder at the user's chosen reminderTime.
 *
 * Scope: fires while the site is open (even in a background tab). It is NOT a
 * true push notification — a device-closed-site reminder needs a push service.
 * Permission is requested once; the browser persists the answer, so "default"
 * here means the user hasn't been asked yet, and "denied" means never again.
 */
export function DailyReminder() {
  const reminderTime = useQuizStore((s) => s.progress?.reminderTime);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!reminderTime) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const arm = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (Notification.permission === "granted") {
          const progress = useQuizStore.getState().progress;
          const done = progress ? isQuizDone(progress) : false;
          const n = new Notification("Islamic Daily Quiz", {
            body: done
              ? "Today's quiz is done. See you tomorrow for the next five."
              : "Time for today's five questions. Keep the streak alive.",
            icon: "/icons/icon.svg",
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        }
        arm(); // re-arm for tomorrow
      }, msUntilHHmm(reminderTime));
    };

    arm();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [reminderTime]);

  return null;
}
