import type { Pillar, Question, Tier } from "@/types";
import { quranQuestions } from "./quran";
import { hadithQuestions } from "./hadith";
import { seerahQuestions } from "./seerah";

export const ALL_QUESTIONS: Question[] = [
  ...quranQuestions,
  ...hadithQuestions,
  ...seerahQuestions,
];

const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return byId.get(id);
}

export function questionsByPillar(pillar: Pillar): Question[] {
  return ALL_QUESTIONS.filter((q) => q.pillar === pillar);
}

export function questionsByTier(tier: Tier): Question[] {
  return ALL_QUESTIONS.filter((q) => q.tier === tier);
}

/** Counts for the content dashboard / seed summary. */
export function questionBankStats() {
  const total = ALL_QUESTIONS.length;
  const byPillar = ALL_QUESTIONS.reduce(
    (acc, q) => {
      acc[q.pillar] += 1;
      return acc;
    },
    { quran: 0, hadith: 0, seerah: 0 } as Record<Pillar, number>,
  );
  const byTier = ALL_QUESTIONS.reduce(
    (acc, q) => {
      acc[q.tier] += 1;
      return acc;
    },
    { newbie: 0, average: 0, intermediate: 0 } as Record<Tier, number>,
  );
  const reviewCount = ALL_QUESTIONS.filter((q) => q.confidence === "review").length;
  return { total, byPillar, byTier, reviewCount };
}
