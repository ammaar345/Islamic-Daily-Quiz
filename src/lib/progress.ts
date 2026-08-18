import type { Tier, UserProgress } from "@/types";

/* ---- Tuning knobs (backend flags in production) ---- */
export const XP_CORRECT = 10;
export const XP_STREAK_BONUS = 5;
export const XP_STREAK_BONUS_CAP = 25;
export const LEVEL_COST_BASE = 50; // level n → n * LEVEL_COST_BASE xp

export const QUIZ_LENGTH = 5;

export const TIER_ORDER: Tier[] = ["newbie", "average", "intermediate"];

/** Tier thresholds by level */
export function tierFromLevel(level: number): Tier {
  if (level <= 10) return "newbie";
  if (level <= 25) return "average";
  return "intermediate";
}

export function levelCost(level: number): number {
  return level * LEVEL_COST_BASE;
}

/** Total XP required to reach a given level (starting from level 1). */
export function cumulativeXpForLevel(level: number): number {
  let xp = 0;
  for (let l = 1; l < level; l++) xp += levelCost(l);
  return xp;
}

/** Returns level + progress info for a given xp total. */
export function levelFromXp(xp: number): {
  level: number;
  intoLevel: number;
  cost: number;
  xpForNext: number;
} {
  let level = 1;
  let remaining = xp;
  while (remaining >= levelCost(level) && level < 100) {
    remaining -= levelCost(level);
    level += 1;
  }
  return {
    level,
    intoLevel: remaining,
    cost: levelCost(level),
    xpForNext: Math.max(1, levelCost(level) - remaining),
  };
}

/** Streak bonus for a current streak length, capped. */
export function streakBonus(streak: number): number {
  return Math.min(streak * XP_STREAK_BONUS, XP_STREAK_BONUS_CAP);
}

/** XP a single correct answer earns given current streak. */
export function xpForCorrect(streak: number): number {
  return XP_CORRECT + streakBonus(streak);
}

/* ---- Dates ---- */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDate(d);
}

export function isQuizDone(p: UserProgress): boolean {
  const today = localDate();
  return p.sessions.some((s) => s.date === today && s.completedAt !== null);
}

export function canPlayToday(p: UserProgress): boolean {
  return !isQuizDone(p);
}

/* ---- Core transitions ---- */
export interface ApplyAnswerInput {
  p: UserProgress;
  questionId: string;
  correct: boolean;
}

export interface ApplyAnswerResult {
  next: UserProgress;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
}

/** Mutates copy. Correct answer → xp + streak credit (streak applied on completion). */
export function applyAnswer({
  p,
  questionId,
  correct,
}: ApplyAnswerInput): ApplyAnswerResult {
  const prevLevel = levelFromXp(p.xp).level;
  const gained = correct ? xpForCorrect(p.streak) : 0;

  const next: UserProgress = {
    ...p,
    xp: p.xp + gained,
    answeredQuestionIds: [...p.answeredQuestionIds, questionId],
    missedQuestionIds: correct
      ? p.missedQuestionIds.filter((id) => id !== questionId)
      : Array.from(new Set([...p.missedQuestionIds, questionId])),
  };

  const newLevel = levelFromXp(next.xp).level;
  return {
    next,
    xpGained: gained,
    leveledUp: newLevel > prevLevel,
    newLevel,
  };
}

/**
 * Finalize a completed session: apply streak advance (or reset) and persist.
 * Streak rule: completing today's quiz advances streak by 1 if yesterday was
 * the last streak day; otherwise streak restarts at 1.
 */
export function completeSession(
  p: UserProgress,
  sessionId: string,
): UserProgress {
  const today = localDate();
  const streaksToday = p.lastQuizDate === yesterday();
  const nextStreak = streaksToday ? p.streak + 1 : 1;

  return {
    ...p,
    streak: nextStreak,
    lastQuizDate: today,
    sessions: p.sessions.map((s) =>
      s.id === sessionId ? { ...s, completedAt: new Date().toISOString() } : s,
    ),
  };
}
