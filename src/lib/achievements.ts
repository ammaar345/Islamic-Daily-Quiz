import type { AnswerRecord, Pillar, UserProgress } from "@/types";
import { levelFromXp } from "./progress";

/**
 * Achievements are DERIVED from progress, never stored. Every badge is a pure
 * function of the current UserProgress, so there is nothing to sync and no
 * schema to migrate. Trade-off: a badge that depends on "has ever happened"
 * (e.g. review pool cleared) is evaluated against the CURRENT state, so it can
 * lock again if the condition stops holding. Acceptable for v1.
 */

export type AchievementGroup =
  | "daily"
  | "streak"
  | "progress"
  | "mastery"
  | "practice";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Safe unicode dingbat (no emoji). */
  icon: string;
  /** Tailwind gradient classes for the earned icon circle. */
  accent: string;
  group: AchievementGroup;
}

export const ACHIEVEMENTS: Achievement[] = [
  /* ---- Daily ---- */
  {
    id: "first-day",
    title: "First Day",
    description: "Complete your first daily quiz",
    icon: "✦",
    accent: "from-gold to-gold-deep",
    group: "daily",
  },
  {
    id: "perfect-quiz",
    title: "Flawless",
    description: "Score a perfect 5/5 daily quiz",
    icon: "◈",
    accent: "from-success to-success/80",
    group: "daily",
  },
  /* ---- Streak ---- */
  {
    id: "streak-3",
    title: "Three in a Row",
    description: "Complete the daily quiz 3 days in a row",
    icon: "✧",
    accent: "from-gold to-gold-deep",
    group: "streak",
  },
  {
    id: "streak-7",
    title: "A Steady Flame",
    description: "Keep a 7-day streak",
    icon: "⬡",
    accent: "from-gold to-gold-deep",
    group: "streak",
  },
  {
    id: "streak-30",
    title: "A Month of Light",
    description: "Keep a 30-day streak",
    icon: "▣",
    accent: "from-gold to-gold-deep",
    group: "streak",
  },
  /* ---- Progress / levels ---- */
  {
    id: "level-5",
    title: "Seeker",
    description: "Reach level 5",
    icon: "✦",
    accent: "from-primary to-primary-deep",
    group: "progress",
  },
  {
    id: "tier-average",
    title: "On the Path",
    description: "Reach the Average tier (level 11)",
    icon: "◈",
    accent: "from-primary to-primary-deep",
    group: "progress",
  },
  {
    id: "tier-intermediate",
    title: "Fountain of Knowledge",
    description: "Reach the Intermediate tier (level 26)",
    icon: "⬡",
    accent: "from-primary to-primary-deep",
    group: "progress",
  },
  /* ---- Mastery (pillar-specific) ---- */
  {
    id: "pillar-quran",
    title: "Companion of the Quran",
    description: "25 correct Quran answers",
    icon: "✦",
    accent: "from-primary to-primary-deep",
    group: "mastery",
  },
  {
    id: "pillar-hadith",
    title: "Student of the Sunnah",
    description: "25 correct Hadith answers",
    icon: "◈",
    accent: "from-gold to-gold-deep",
    group: "mastery",
  },
  {
    id: "pillar-seerah",
    title: "Lover of the Seerah",
    description: "25 correct Seerah answers",
    icon: "✧",
    accent: "from-cream to-ink-soft",
    group: "mastery",
  },
  /* ---- Practice ---- */
  {
    id: "practice-first",
    title: "Diligent Review",
    description: "Complete a practice session",
    icon: "✧",
    accent: "from-gold to-gold-deep",
    group: "practice",
  },
  {
    id: "review-clear",
    title: "Dust It Off",
    description: "Clear every question in your review pool",
    icon: "✓",
    accent: "from-success to-success/80",
    group: "practice",
  },
  {
    id: "practice-ten",
    title: "Repetition Remembers",
    description: "Complete 10 practice sessions",
    icon: "▣",
    accent: "from-gold to-gold-deep",
    group: "practice",
  },
];

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/* ---- Pure derivation helpers ---- */

/** Dates (local YYYY-MM-DD) of completed daily quizzes. */
function completedDailyDates(p: UserProgress): string[] {
  return p.sessions
    .filter((s) => s.completedAt !== null && s.total > 0 && s.questions.length > 0)
    .map((s) => s.date);
}

function isNextDay(prev: string, cur: string): boolean {
  const diff =
    (new Date(cur + "T00:00:00").getTime() -
      new Date(prev + "T00:00:00").getTime()) /
    86_400_000;
  return diff === 1;
}

/** Longest run of consecutive completed daily-quiz days. */
function maxStreakDays(dates: string[]): number {
  const uniq = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of uniq) {
    run = prev && isNextDay(prev, d) ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/** Correct-answer tally per pillar across daily + practice history. */
function pillarCorrectCounts(p: UserProgress): Record<Pillar, number> {
  const counts: Record<Pillar, number> = { quran: 0, hadith: 0, seerah: 0 };
  const tally = (answers: AnswerRecord[]) => {
    for (const a of answers) if (a.correct) counts[a.pillar] += 1;
  };
  for (const s of p.sessions) tally(s.answers);
  for (const s of p.practiceSessions ?? []) tally(s.answers);
  return counts;
}

/**
 * Which achievements are currently earned, in catalog order.
 */
export function computeAchievements(p: UserProgress): string[] {
  const level = levelFromXp(p.xp).level;
  const dates = completedDailyDates(p);
  const streak = maxStreakDays(dates);
  const counts = pillarCorrectCounts(p);
  const practiceCount = (p.practiceSessions ?? []).length;
  const earned = new Set<string>();

  if (dates.length > 0) earned.add("first-day");
  if (
    p.sessions.some(
      (s) => s.completedAt !== null && s.total > 0 && s.score === s.total,
    )
  ) {
    earned.add("perfect-quiz");
  }

  if (streak >= 3) earned.add("streak-3");
  if (streak >= 7) earned.add("streak-7");
  if (streak >= 30) earned.add("streak-30");

  if (level >= 5) earned.add("level-5");
  if (level >= 11) earned.add("tier-average");
  if (level >= 26) earned.add("tier-intermediate");

  if (counts.quran >= 25) earned.add("pillar-quran");
  if (counts.hadith >= 25) earned.add("pillar-hadith");
  if (counts.seerah >= 25) earned.add("pillar-seerah");

  if (practiceCount > 0) earned.add("practice-first");
  if (practiceCount > 0 && p.missedQuestionIds.length === 0) {
    earned.add("review-clear");
  }
  if (practiceCount >= 10) earned.add("practice-ten");

  return ACHIEVEMENTS.filter((a) => earned.has(a.id)).map((a) => a.id);
}
