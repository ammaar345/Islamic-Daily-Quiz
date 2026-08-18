export type Pillar = "quran" | "hadith" | "seerah";
export type Tier = "newbie" | "average" | "intermediate";

export interface Question {
  id: string;
  pillar: Pillar;
  tier: Tier;
  difficulty: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  /** Optional original text (Quranic verse / hadith / Arabic) */
  arabic?: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  /** Legitimate source citation, e.g. "Quran 2:255" or "Sahih al-Bukhari" */
  source: string;
  /** review = needs second pass by someone with Islamic knowledge before public release */
  confidence: "high" | "review";
}

export interface AnswerRecord {
  questionId: string;
  pillar: Pillar;
  selectedIndex: number | null;
  correct: boolean;
  xpEarned: number;
  answeredAt: string; // ISO date
}

export interface QuizSession {
  id: string;
  date: string; // YYYY-MM-DD local
  /** The served questions with their (already shuffled) options. */
  questions: Question[];
  answers: AnswerRecord[];
  score: number;
  total: number;
  xpEarned: number;
  completedAt: string | null;
}

export interface UserProgress {
  name: string;
  email: string;
  xp: number;
  streak: number;
  lastQuizDate: string | null;
  answeredQuestionIds: string[]; // pool of seen questions
  missedQuestionIds: string[]; // review pool
  sessions: QuizSession[];
  reminderTime?: string; // HH:mm local
  /** Practice (review-pool) sessions. Never used for the daily gate, streak, or XP. */
  practiceSessions?: QuizSession[];
}
