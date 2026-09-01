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
  | "knowledge"
  | "mastery"
  | "practice"
  | "progress";

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
  /* ---- Knowledge ---- */
  {
    id: "perfect-week",
    title: "Unbroken",
    description: "Score 100% on 7 daily quizzes (not necessarily consecutive)",
    icon: "◈",
    accent: "from-success to-success/80",
    group: "knowledge",
  },
  {
    id: "second-chance",
    title: "Second Chance",
    description: "Answer correctly a question you previously missed",
    icon: "↻",
    accent: "from-gold to-gold-deep",
    group: "knowledge",
  },
  {
    id: "mastered-it",
    title: "Mastered It",
    description: "90%+ accuracy in any pillar (min 20 answers)",
    icon: "★",
    accent: "from-primary to-primary-deep",
    group: "mastery",
  },
  /* ---- Category expansions (100 & 250) ---- */
  {
    id: "pillar-quran-100",
    title: "Quran Student",
    description: "100 correct Quran answers",
    icon: "✦",
    accent: "from-primary to-primary-deep",
    group: "mastery",
  },
  {
    id: "pillar-quran-250",
    title: "Quran Scholar",
    description: "250 correct Quran answers",
    icon: "✦",
    accent: "from-cream to-gold",
    group: "mastery",
  },
  {
    id: "pillar-hadith-100",
    title: "Hadith Student",
    description: "100 correct Hadith answers",
    icon: "◈",
    accent: "from-gold to-gold-deep",
    group: "mastery",
  },
  {
    id: "pillar-hadith-250",
    title: "Hadith Master",
    description: "250 correct Hadith answers",
    icon: "◈",
    accent: "from-cream to-gold",
    group: "mastery",
  },
  {
    id: "pillar-seerah-100",
    title: "Seerah Student",
    description: "100 correct Seerah answers",
    icon: "✧",
    accent: "from-primary to-primary-deep",
    group: "mastery",
  },
  {
    id: "pillar-seerah-250",
    title: "Seerah Scholar",
    description: "250 correct Seerah answers",
    icon: "✧",
    accent: "from-cream to-gold",
    group: "mastery",
  },
  /* ---- Progression ---- */
  {
    id: "level-10",
    title: "Apprentice",
    description: "Reach level 10",
    icon: "✦",
    accent: "from-primary to-primary-deep",
    group: "progress",
  },
  {
    id: "level-25",
    title: "Dedicated",
    description: "Reach level 25",
    icon: "◈",
    accent: "from-primary to-primary-deep",
    group: "progress",
  },
  {
    id: "level-50",
    title: "Elder",
    description: "Reach level 50",
    icon: "⬡",
    accent: "from-primary to-primary-deep",
    group: "progress",
  },
  {
    id: "xp-hoarder",
    title: "XP Hoarder",
    description: "Earn 10,000 XP",
    icon: "✧",
    accent: "from-gold to-cream",
    group: "progress",
  },
  /* ---- Streak ---- */
  {
    id: "the-comeback",
    title: "The Comeback",
    description: "Rebuild to a 7-day streak after a gap",
    icon: "↻",
    accent: "from-gold to-gold-deep",
    group: "streak",
  },
  /* ---- Time-based ---- */
  {
    id: "night-owl",
    title: "Night Owl",
    description: "Complete a quiz after 11pm",
    icon: "☾",
    accent: "from-ink/60 to-ink",
    group: "daily",
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
  return diff > 0 && diff <= 2;
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

/** Total correct answers per pillar across daily + practice history. */
function pillarCorrectCounts(p: UserProgress): Record<Pillar, number> {
  const counts: Record<Pillar, number> = { quran: 0, hadith: 0, seerah: 0 };
  const tally = (answers: AnswerRecord[]) => {
    for (const a of answers) if (a.correct) counts[a.pillar] += 1;
  };
  for (const s of p.sessions) tally(s.answers);
  for (const s of p.practiceSessions ?? []) tally(s.answers);
  return counts;
}

/** Total answered per pillar across daily + practice history. */
function pillarTotalCounts(p: UserProgress): Record<Pillar, number> {
  const counts: Record<Pillar, number> = { quran: 0, hadith: 0, seerah: 0 };
  const tally = (answers: AnswerRecord[]) => {
    for (const a of answers) counts[a.pillar] += 1;
  };
  for (const s of p.sessions) tally(s.answers);
  for (const s of p.practiceSessions ?? []) tally(s.answers);
  return counts;
}

/** Count of perfect daily quizzes. */
function perfectQuizCount(p: UserProgress): number {
  return p.sessions.filter(
    (s) => s.completedAt !== null && s.total > 0 && s.score === s.total,
  ).length;
}

/** Whether user has corrected a previously missed question. */
function hasSecondChance(p: UserProgress): boolean {
  const corrected = new Set<string>();
  for (const s of p.sessions) {
    for (const a of s.answers) {
      if (a.correct && p.missedQuestionIds.includes(a.questionId)) {
        corrected.add(a.questionId);
      }
    }
  }
  for (const s of p.practiceSessions ?? []) {
    for (const a of s.answers) {
      if (a.correct && p.missedQuestionIds.includes(a.questionId)) {
        corrected.add(a.questionId);
      }
    }
  }
  return corrected.size > 0;
}

/** Whether any pillar has 90%+ accuracy with min 20 answers. */
function hasMasteredPillar(p: UserProgress): boolean {
  const correct = pillarCorrectCounts(p);
  const total = pillarTotalCounts(p);
  for (const pillar of ["quran", "hadith", "seerah"] as Pillar[]) {
    if (total[pillar] >= 20 && correct[pillar] / total[pillar] >= 0.9) {
      return true;
    }
  }
  return false;
}

/** Whether user rebuilt a 7-day streak after a gap (comeback). */
function hasComebackStreak(p: UserProgress): boolean {
  const dates = completedDailyDates(p).sort();
  let currentRun = 0;
  let prev: string | null = null;
  let hadGap = false;
  for (const d of dates) {
    const isConsecutive = prev && isNextDay(prev, d);
    if (!isConsecutive && prev) hadGap = true;
    currentRun = isConsecutive ? currentRun + 1 : 1;
    if (hadGap && currentRun >= 7) return true;
    prev = d;
  }
  return false;
}

/** Whether any completed session finished after 23:00 local time. */
function hasNightOwl(p: UserProgress): boolean {
  for (const s of p.sessions) {
    if (!s.completedAt) continue;
    const hour = new Date(s.completedAt).getHours();
    if (hour >= 23) return true;
  }
  for (const s of p.practiceSessions ?? []) {
    if (!s.completedAt) continue;
    const hour = new Date(s.completedAt).getHours();
    if (hour >= 23) return true;
  }
  return false;
}

/**
 * Which achievements are currently earned, in catalog order.
 */
export function computeAchievements(p: UserProgress): string[] {
  const level = levelFromXp(p.xp).level;
  const dates = completedDailyDates(p);
  const streak = maxStreakDays(dates);
  const counts = pillarCorrectCounts(p);
  const totals = pillarTotalCounts(p);
  const practiceCount = (p.practiceSessions ?? []).length;
  const perfectCount = perfectQuizCount(p);
  const earned = new Set<string>();

  if (dates.length > 0) earned.add("first-day");
  if (perfectCount > 0) earned.add("perfect-quiz");
  if (perfectCount >= 7) earned.add("perfect-week");
  if (hasSecondChance(p)) earned.add("second-chance");
  if (hasMasteredPillar(p)) earned.add("mastered-it");

  if (streak >= 3) earned.add("streak-3");
  if (streak >= 7) earned.add("streak-7");
  if (streak >= 30) earned.add("streak-30");
  if (hasComebackStreak(p)) earned.add("the-comeback");

  if (level >= 5) earned.add("level-5");
  if (level >= 10) earned.add("level-10");
  if (level >= 11) earned.add("tier-average");
  if (level >= 25) earned.add("level-25");
  if (level >= 26) earned.add("tier-intermediate");
  if (level >= 50) earned.add("level-50");
  if (p.xp >= 10_000) earned.add("xp-hoarder");

  if (counts.quran >= 25) earned.add("pillar-quran");
  if (counts.quran >= 100) earned.add("pillar-quran-100");
  if (counts.quran >= 250) earned.add("pillar-quran-250");
  if (counts.hadith >= 25) earned.add("pillar-hadith");
  if (counts.hadith >= 100) earned.add("pillar-hadith-100");
  if (counts.hadith >= 250) earned.add("pillar-hadith-250");
  if (counts.seerah >= 25) earned.add("pillar-seerah");
  if (counts.seerah >= 100) earned.add("pillar-seerah-100");
  if (counts.seerah >= 250) earned.add("pillar-seerah-250");

  if (practiceCount > 0) earned.add("practice-first");
  if (practiceCount > 0 && p.missedQuestionIds.length === 0) {
    earned.add("review-clear");
  }
  if (practiceCount >= 10) earned.add("practice-ten");

  if (hasNightOwl(p)) earned.add("night-owl");

  return ACHIEVEMENTS.filter((a) => earned.has(a.id)).map((a) => a.id);
}
