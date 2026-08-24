"use client";

import Link from "next/link";
import { useQuizStore, useLevelInfo } from "@/lib/store";
import { isQuizDone } from "@/lib/progress";
import { LevelRing } from "@/components/LevelRing";
import { Achievements } from "@/components/Achievements";
import { ActivityStrip } from "@/components/ActivityStrip";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const TIER_PATH = [
  { id: "newbie", label: "Newbie", range: "Levels 1–10" },
  { id: "average", label: "Average", range: "Levels 11–25" },
  { id: "intermediate", label: "Intermediate", range: "Level 26+" },
];

export default function DashboardPage() {
  const progress = useQuizStore((s) => s.progress);
  const levelInfo = useLevelInfo();

  if (!progress || !levelInfo) return null;

  const done = isQuizDone(progress);
  const last = progress.sessions[progress.sessions.length - 1];
  const tierIdx = TIER_PATH.findIndex((t) => t.id === levelInfo.tier);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-ink">
          Salam, {progress.name}
        </h1>
        <p className="mt-1 text-ink-soft">
          Level {levelInfo.level} · {TIER_PATH[tierIdx]?.label} ·{" "}
          {progress.streak > 0 ? (
            <span className="font-semibold text-gold-deep">
              {progress.streak}-day streak
            </span>
          ) : (
            "streak not started"
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Level ring */}
        <div className="glass flex flex-col items-center justify-center gap-2 rounded-card p-8 lg:col-span-2 animate-fade-up">
          <LevelRing
            level={levelInfo.level}
            intoLevel={levelInfo.intoLevel}
            cost={levelInfo.cost}
            tier={levelInfo.tier}
          />
          <p className="text-center text-sm text-ink-soft">
            {levelInfo.xpForNext} XP to next level
          </p>
        </div>

        {/* Today's quiz */}
        <div className="glass flex flex-col justify-between rounded-card p-8 lg:col-span-3 animate-fade-up">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Today&apos;s quiz
            </p>
            {done ? (
              <>
                <h2 className="mt-3 flex items-center gap-2 font-display text-2xl font-bold text-ink">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-success to-success/80 text-white shadow-soft">
                    ✓
                  </span>
                  Completed
                </h2>
                <p className="mt-2 text-ink-soft">
                  Nice work. Come back tomorrow to keep your streak going — your
                  quiz refreshes at midnight.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-3 font-display text-2xl font-bold text-ink">
                  Ready when you are
                </h2>
                <p className="mt-2 text-ink-soft">
                  5 questions · about 3 minutes · Quran, Hadith and Seerah.
                  One shot per day.
                </p>
              </>
            )}
          </div>
          <div className="mt-6">
            {done ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-gold-soft px-4 py-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5 text-gold"
                    aria-hidden
                  >
                    <path
                      d="M12 21c3.5 0 6-2.4 6-5.7 0-2.6-1.7-4.4-3.3-6.1-.9-.9-1.7-2-1.7-3.6 0-1 .4-1.8.7-2.5-2.6.5-4.4 2.7-4.4 5.2 0 1.1.4 2 .9 2.8C8.4 12.6 6 14.5 6 17.3 6 19.2 7.6 21 9.4 21c.9 0 1.6-.3 2.3-.8.1.5.2 1 .2 1.5 0 .4-.3.8-.7.9.2 0 .4.1.8.1z"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-semibold text-gold-deep">{progress.streak} day</span>
                </div>
                <p className="text-sm text-ink-soft">
                  {progress.streak === 1
                    ? "Streak lit — protect it tomorrow."
                    : "Keep the flame alive tomorrow."}
                </p>
              </div>
            ) : (
              <Link href="/quiz">
                <Button className="w-full sm:w-auto">Start today&apos;s quiz</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats — cozy pill tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-fade-up">
        {[
          { label: "Total XP", value: progress.xp, accent: "from-primary to-primary-dark" },
          { label: "Streak", value: `${progress.streak}d`, accent: "from-gold to-gold-deep" },
          { label: "Questions answered", value: progress.answeredQuestionIds.length, accent: "from-primary-dark to-primary-deep" },
          { label: "In review pool", value: progress.missedQuestionIds.length, accent: "from-cream to-mint" },
        ].map((s) => (
          <div
            key={s.label}
            className="glass rounded-card p-5 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex items-baseline gap-2">
              <p className="font-display text-3xl font-bold text-ink">{s.value}</p>
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-b",
                  s.accent,
                )}
              />
            </div>
            <p className="mt-1 text-sm text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Consistency strip */}
      <div className="glass rounded-card p-6 animate-fade-up">
        <ActivityStrip sessions={progress.sessions} />
      </div>

      {/* Review pool / practice */}
      {progress.missedQuestionIds.length > 0 && (
        <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-card p-6 animate-fade-up">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              Review pool
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              {progress.missedQuestionIds.length} question
              {progress.missedQuestionIds.length === 1 ? "" : "s"} to revisit.
              Practice them — no timer, no pressure, no XP lost.
            </p>
          </div>
          <Link href="/practice">
            <Button variant="outline">Practice mistakes</Button>
          </Link>
        </div>
      )}

      {/* Tier path */}
      <div className="glass rounded-card p-6 animate-fade-up">
        <h3 className="font-display text-lg font-bold text-ink">Your path</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TIER_PATH.map((t, i) => {
            const current = i === tierIdx;
            const passed = i < tierIdx;
            return (
              <div
                key={t.id}
                className={cn(
                  "relative rounded-2xl border p-4 transition-all duration-200",
                  current
                    ? "border-gold/40 bg-gradient-to-b from-gold-soft/80 to-surface/40 shadow-glow"
                    : passed
                      ? "border-border-soft bg-surface/60"
                      : "border-dashed border-ink/15 bg-transparent",
                )}
              >
                {passed && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-success to-success/80 text-xs text-white shadow-soft">
                    ✓
                  </span>
                )}
                {current && (
                  <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    You are here
                  </span>
                )}
                <p className="font-semibold text-ink">{t.label}</p>
                <p className="text-sm text-ink-soft">{t.range}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <Achievements progress={progress} />

      {/* Last session */}
      {last && (
        <div className="glass rounded-card p-6 animate-fade-up">
          <h3 className="font-display text-lg font-bold text-ink">
            Most recent quiz
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-ink-soft">
            <span>{last.date}</span>
            <span>
              Score:{" "}
              <span className="font-semibold text-ink">
                {last.score}/{last.total}
              </span>
            </span>
            <span>
              XP earned:{" "}
              <span className="font-semibold text-gold-deep">+{last.xpEarned}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
