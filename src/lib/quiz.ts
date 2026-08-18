import type { Question, QuizSession, UserProgress } from "@/types";
import { QUIZ_LENGTH, levelFromXp, tierFromLevel } from "./progress";
import { ALL_QUESTIONS, getQuestion } from "./questions";

/** Deterministic-ish Fisher-Yates shuffle (random order is fine per session). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Copy a question with its options shuffled and answerIndex remapped. */
export function withShuffledOptions(q: Question): Question {
  const order = shuffle(q.options.map((_, i) => i));
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answerIndex: order.indexOf(q.answerIndex),
  };
}

export interface DailyComposition {
  fresh: Question[];
  review: Question[];
  elevated: Question[];
}

/**
 * Build today's quiz for a user.
 * Composition: 3 fresh + 1 review (missed) + 1 elevated (harder), with graceful
 * fallbacks when pools are empty. Pillars are rotated so each day covers a mix.
 */
export function buildDailyQuiz(p: UserProgress): Question[] {
  const seen = new Set(p.answeredQuestionIds);
  const tier = tierFromLevel(levelFromXp(p.xp).level);

  const fresh = ALL_QUESTIONS.filter(
    (q) => !seen.has(q.id) && q.tier === tier,
  );
  const lowerTier = ALL_QUESTIONS.filter(
    (q) => !seen.has(q.id) && q.tier !== tier,
  );
  // NOTE: do NOT filter review by `seen` — every missed question is also in
  // answeredQuestionIds, so that filter would empty the review slot entirely.
  // Resurfacing a seen-but-missed question is the whole point of the pool.
  const review = p.missedQuestionIds
    .map((id) => getQuestion(id))
    .filter((q): q is Question => !!q);
  // Elevated slot: harder questions within the user's own tier only —
  // never cross-tier for a fresh user.
  const elevated = ALL_QUESTIONS.filter(
    (q) => !seen.has(q.id) && q.tier === tier && q.difficulty >= 4,
  );

  const pick = (
    pool: Question[],
    n: number,
    fallback: Question[] = [],
  ): Question[] => {
    const chosen = shuffle(pool).slice(0, n);
    const need = n - chosen.length;
    return need > 0 ? [...chosen, ...shuffle(fallback).slice(0, need)] : chosen;
  };

  const freshPick = pick(fresh, 3, lowerTier);
  const reviewPick = pick(review, 1);
  const elevatedPick = pick(elevated, 1, freshPick);

  // Dedup preserving order, then pad to QUIZ_LENGTH.
  const ids = new Set<string>();
  const chosen: Question[] = [];
  for (const q of [...freshPick, ...reviewPick, ...elevatedPick, ...ALL_QUESTIONS]) {
    if (chosen.length >= QUIZ_LENGTH) break;
    if (!ids.has(q.id)) {
      ids.add(q.id);
      chosen.push(q);
    }
  }

  return chosen.map(withShuffledOptions);
}

export function createSession(
  p: UserProgress,
  questions: Question[],
  date: string,
): QuizSession {
  const id = `s_${date}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    date,
    questions,
    answers: [],
    score: 0,
    total: questions.length,
    xpEarned: 0,
    completedAt: null,
  };
}
