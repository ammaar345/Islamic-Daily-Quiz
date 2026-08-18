"use client";

import type { UserProgress } from "@/types";
import { ACHIEVEMENTS, computeAchievements } from "@/lib/achievements";
import { cn } from "@/lib/cn";

/**
 * Badge wall. Earned = gold/pillar accent, locked = dashed ghost tile.
 * Purely derived from progress — no store wiring, no persistence.
 */
export function Achievements({ progress }: { progress: UserProgress }) {
  const earned = new Set(computeAchievements(progress));

  return (
    <div className="glass rounded-card p-6 animate-fade-up">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-ink">
          Achievements
        </h3>
        <span className="text-sm font-semibold tabular-nums text-ink-soft">
          {earned.size} of {ACHIEVEMENTS.length} earned
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const got = earned.has(a.id);
          return (
            <div
              key={a.id}
              title={got ? undefined : "Locked"}
              className={cn(
                "rounded-2xl border p-3 text-center transition-colors duration-200",
                got
                  ? "border-gold/30 bg-gradient-to-b from-gold-soft/70 to-surface/40"
                  : "border-dashed border-ink/15 bg-transparent",
              )}
            >
              <span
                className={cn(
                  "mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b text-lg shadow-soft",
                  got ? `${a.accent} text-white` : "bg-ink/5 text-ink/30",
                )}
              >
                {a.icon}
              </span>
              <p
                className={cn(
                  "mt-2 text-sm font-semibold leading-tight",
                  got ? "text-ink" : "text-ink-soft",
                )}
              >
                {a.title}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[11px] leading-tight",
                  got ? "text-ink-soft" : "text-ink-soft/60",
                )}
              >
                {a.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
