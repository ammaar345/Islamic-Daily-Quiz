"use client";

import { localDate } from "@/lib/progress";
import { cn } from "@/lib/cn";

const DAYS = 14;

/**
 * Consistency strip: one cell per day for the last 14 days, filled when a
 * quiz was completed that day. Pure display — derived from completed sessions.
 */
export function ActivityStrip({ sessions }: { sessions: { date: string; completedAt: string | null }[] }) {
  const completed = new Set(
    sessions.filter((s) => s.completedAt !== null).map((s) => s.date),
  );

  const days: { date: string; done: boolean }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = localDate(d);
    days.push({ date, done: completed.has(date) });
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <h3 className="font-display text-lg font-bold text-ink">
          Last {DAYS} days
        </h3>
        <p className="text-sm text-ink-soft">
          {days.filter((d) => d.done).length}/{DAYS} completed
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" role="img" aria-label={`Quiz completed on ${days.filter((d) => d.done).length} of the last ${DAYS} days`}>
        {days.map((d) => (
          <span
            key={d.date}
            title={`${d.date}${d.done ? " — completed" : ""}`}
            className={cn(
              "h-6 flex-1 rounded-md transition-colors",
              d.done
                ? "bg-gradient-to-b from-gold to-gold-deep"
                : "bg-ink/10",
            )}
          />
        ))}
      </div>
    </div>
  );
}
