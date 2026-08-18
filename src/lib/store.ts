"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Question, QuizSession, UserProgress } from "@/types";
import { buildDailyQuiz, createSession, shuffle, withShuffledOptions } from "./quiz";
import {
  QUIZ_LENGTH,
  applyAnswer,
  completeSession,
  isQuizDone,
  levelFromXp,
  localDate,
  tierFromLevel,
} from "./progress";
import { getQuestion } from "./questions";
import { supabase } from "./supabase";
import { fetchServerProgress, queuePush } from "./sync";
import { friendlyAuthError } from "./auth";

const EMPTY_PROGRESS = (
  name: string,
  email: string,
  startingXp = 0,
  reminderTime = "08:00",
): UserProgress => ({
  name,
  email,
  xp: startingXp,
  streak: 0,
  lastQuizDate: null,
  answeredQuestionIds: [],
  missedQuestionIds: [],
  sessions: [],
  reminderTime,
});

export interface AnswerOutcome {
  correct: boolean;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  explanation: string;
  source: string;
}

export interface SignInResult {
  ok: boolean;
  error?: string;
}

interface QuizStore {
  progress: UserProgress | null;
  currentSession: QuizSession | null;
  /** Live practice (review-pool) session. Separate from the daily gate/XP path. */
  practiceSession: QuizSession | null;
  signIn: (
    name: string,
    email: string,
    password: string,
    startingXp?: number,
    reminderTime?: string,
  ) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** Pull server progress into the store (used after sign-in / on load). */
  hydrateProgress: () => Promise<void>;
  startQuiz: () => boolean;
  answer: (questionId: string, selectedIndex: number) => AnswerOutcome | null;
  finishQuiz: () => void;
  startPractice: () => boolean;
  practiceAnswer: (questionId: string, selectedIndex: number) => AnswerOutcome | null;
  finishPractice: () => void;
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      progress: null,
      currentSession: null,
      practiceSession: null,

      signIn: async (
        name,
        email,
        password,
        startingXp = 0,
        reminderTime = "08:00",
      ) => {
        // ---- Demo mode: local progress only ----
        if (!supabase) {
          set({
            progress: EMPTY_PROGRESS(
              name.trim(),
              email.trim(),
              startingXp,
              reminderTime,
            ),
          });
          return { ok: true };
        }

        // ---- Real mode: try existing account, else create one ----
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          // An existing-but-unconfirmed account fails signIn; don't mislead
          // with the "check your password" path below.
          if (signInErr.message.toLowerCase().includes("not confirmed")) {
            return {
              ok: false,
              error: "Confirm your email first, then sign in.",
            };
          }
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, starting_xp: startingXp, reminder_time: reminderTime },
            },
          });
          if (signUpErr) {
            const registered = signUpErr.message
              .toLowerCase()
              .includes("already registered");
            return {
              ok: false,
              error: registered
                ? "That email is registered — check your password."
                : friendlyAuthError(signUpErr),
            };
          }
          // Signup returned. Session exists only if email confirmation is off.
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            return {
              ok: false,
              error:
                "Check your email for a confirmation link, then sign in.",
            };
          }
        }

        // Signed in (or just signed up). Migrate a richer local demo profile
        // up first, then pull the merged server state back down.
        const local = get().progress;
        const server = await fetchServerProgress();
        if (local && server && local.xp > server.xp) {
          await queuePush(local);
        }
        await get().hydrateProgress();
        return { ok: true };
      },

      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        set({ progress: null, currentSession: null, practiceSession: null });
      },

      hydrateProgress: async () => {
        if (!supabase) return;
        const server = await fetchServerProgress();
        if (!server) return;
        const today = localDate();
        const inFlight =
          server.sessions.find(
            (s) =>
              s.date === today && !s.completedAt && s.questions.length > 0,
          ) ?? null;
        set({
          progress: server,
          // Only resume an in-flight session if the store doesn't already
          // hold a live one (guards against clobbering mid-answer state).
          currentSession:
            get().currentSession ?? inFlight,
        });
      },

      startQuiz: () => {
        const { progress, currentSession } = get();
        if (!progress || currentSession) return false;
        if (isQuizDone(progress)) return false; // daily gate: already done today
        const date = localDate();
        const session = createSession(progress, buildDailyQuiz(progress), date);
        // Seed an uncompleted session so isQuizDone() recognises today's quiz as started.
        // completeSession() later stamps completedAt on the matching entry.
        const seededProgress: UserProgress = {
          ...progress,
          sessions: [
            ...progress.sessions,
            {
              id: session.id,
              date: session.date,
              questions: [],
              answers: [],
              score: 0,
              total: session.total,
              xpEarned: 0,
              completedAt: null,
            },
          ],
        };
        set({ currentSession: session, progress: seededProgress });
        // Upload the stub immediately so the server gate (unique user+date)
        // knows today's quiz is started on every device.
        queuePush(seededProgress);
        return true;
      },

      answer: (questionId, selectedIndex) => {
        const { progress, currentSession } = get();
        if (!progress || !currentSession) return null;

        // Idempotency guard: same questionId cannot be answered twice in a session.
        // This makes mid-quiz reloads safe -- reload resets local UI state but the
        // persisted session still knows which questions have been answered.
        const alreadyAnswered = currentSession.answers.some(
          (a) => a.questionId === questionId,
        );
        if (alreadyAnswered) {
          // Return the stored outcome from the existing answer record so the UI
          // can display explanation without re-awarding XP.
          const existing = currentSession.answers.find(
            (a) => a.questionId === questionId,
          )!;
          const q = currentSession.questions.find((x) => x.id === questionId);
          if (!q) return null;
          return {
            correct: existing.correct,
            xpGained: existing.xpEarned,
            leveledUp: false,
            newLevel: levelFromXp(progress.xp).level,
            explanation: q.explanation,
            source: q.source,
          };
        }

        const q = currentSession.questions.find((x) => x.id === questionId);
        if (!q) return null;

        const correct = selectedIndex === q.answerIndex;
        const res = applyAnswer({ p: progress, questionId, correct });

        const session: QuizSession = {
          ...currentSession,
          answers: [
            ...currentSession.answers,
            {
              questionId,
              pillar: q.pillar,
              selectedIndex,
              correct,
              xpEarned: res.xpGained,
              answeredAt: new Date().toISOString(),
            },
          ],
          score: currentSession.score + (correct ? 1 : 0),
          xpEarned: currentSession.xpEarned + res.xpGained,
        };

        // Update the matching session entry in progress.sessions with the latest state
        const updatedProgress: UserProgress = {
          ...res.next,
          sessions: progress.sessions.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  questions: session.questions,
                  score: session.score,
                  total: session.total,
                  xpEarned: session.xpEarned,
                  answers: session.answers,
                }
              : s,
          ),
        };

        set({ progress: updatedProgress, currentSession: session });
        queuePush(updatedProgress);

        return {
          correct,
          xpGained: res.xpGained,
          leveledUp: res.leveledUp,
          newLevel: res.newLevel,
          explanation: q.explanation,
          source: q.source,
        };
      },

      finishQuiz: () => {
        const { progress, currentSession } = get();
        if (!progress || !currentSession) return;
        const p2 = completeSession(progress, currentSession.id);
        // Stamp full session details onto the completed entry so it shows up
        // in "Most recent quiz" and the sessions list is complete.
        const finalProgress: UserProgress = {
          ...p2,
          sessions: p2.sessions.map((s) =>
            s.id === currentSession.id
              ? {
                  ...s,
                  questions: currentSession.questions,
                  answers: currentSession.answers,
                  score: currentSession.score,
                  total: currentSession.total,
                  xpEarned: currentSession.xpEarned,
                }
              : s,
          ),
        };
        set({ progress: finalProgress, currentSession: null });
        queuePush(finalProgress);
      },

      /* ---- Practice mode (review pool). No XP, no streak, no daily gate. ---- */
      startPractice: () => {
        const { progress, practiceSession, currentSession } = get();
        if (!progress || practiceSession || currentSession) return false;
        const pool = progress.missedQuestionIds
          .map((id) => getQuestion(id))
          .filter((q): q is Question => !!q);
        if (pool.length === 0) return false;
        const questions = shuffle(pool)
          .slice(0, QUIZ_LENGTH)
          .map(withShuffledOptions);
        const session: QuizSession = {
          id: `p_${Date.now().toString(36)}`,
          date: localDate(),
          questions,
          answers: [],
          score: 0,
          total: questions.length,
          xpEarned: 0,
          completedAt: null,
        };
        set({ practiceSession: session });
        return true;
      },

      practiceAnswer: (questionId, selectedIndex) => {
        const { progress, practiceSession } = get();
        if (!progress || !practiceSession) return null;

        // Idempotency guard, same as the daily path.
        const alreadyAnswered = practiceSession.answers.some(
          (a) => a.questionId === questionId,
        );
        if (alreadyAnswered) {
          const existing = practiceSession.answers.find(
            (a) => a.questionId === questionId,
          )!;
          const q = practiceSession.questions.find((x) => x.id === questionId);
          if (!q) return null;
          return {
            correct: existing.correct,
            xpGained: 0,
            leveledUp: false,
            newLevel: levelFromXp(progress.xp).level,
            explanation: q.explanation,
            source: q.source,
          };
        }

        const q = practiceSession.questions.find((x) => x.id === questionId);
        if (!q) return null;

        const correct = selectedIndex === q.answerIndex;
        const session: QuizSession = {
          ...practiceSession,
          answers: [
            ...practiceSession.answers,
            {
              questionId,
              pillar: q.pillar,
              selectedIndex,
              correct,
              xpEarned: 0,
              answeredAt: new Date().toISOString(),
            },
          ],
          score: practiceSession.score + (correct ? 1 : 0),
        };

        // Correct practice answer clears the question from the review pool.
        const missedQuestionIds = correct
          ? progress.missedQuestionIds.filter((id) => id !== questionId)
          : progress.missedQuestionIds;
        const practiceSessions = [
          ...(progress.practiceSessions ?? []).filter(
            (s) => s.id !== session.id,
          ),
          session,
        ].slice(-10);

        const updated: UserProgress = {
          ...progress,
          missedQuestionIds,
          practiceSessions,
        };
        set({ progress: updated, practiceSession: session });
        queuePush(updated);

        return {
          correct,
          xpGained: 0,
          leveledUp: false,
          newLevel: levelFromXp(updated.xp).level,
          explanation: q.explanation,
          source: q.source,
        };
      },

      finishPractice: () => {
        const { progress } = get();
        if (!progress) return;
        set({ practiceSession: null });
        queuePush(progress);
      },
    }),
    { name: "idq-progress-v1" },
  ),
);

/* ---- Selectors / derived helpers ---- */
export function useLevelInfo() {
  const progress = useQuizStore((s) => s.progress);
  if (!progress) return null;
  const info = levelFromXp(progress.xp);
  return { ...info, tier: tierFromLevel(info.level) };
}
