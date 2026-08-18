import { supabase } from "./supabase";
import type { UserProgress } from "@/types";

/**
 * Server <-> store sync bridge.
 *
 * Only active when Supabase is configured (env keys present). In demo mode
 * every function is a safe no-op returning null/false, so the rest of the
 * app needs no conditional branching.
 *
 * Model: the client is the source of truth for progress and PUSHES its full
 * state up (upsert, idempotent). On sign-in / page load it PULLS the server
 * state back down so a fresh device restores the account. The daily gate is
 * backstopped server-side by unique(user_id, date) on quiz_sessions.
 */

interface ProfileRow {
  name: string;
  xp: number;
  streak: number;
  last_quiz_date: string | null;
  reminder_time: string;
}

interface SessionRow {
  id: string;
  date: string;
  questions: unknown;
  answers: unknown;
  score: number;
  total: number;
  xp_earned: number;
  completed_at: string | null;
}

interface QuestionProgressRow {
  question_id: string;
  correct: boolean;
}

/** Rebuild the client's UserProgress from the server. Null when signed out / no profile. */
export async function fetchServerProgress(): Promise<UserProgress | null> {
  if (!supabase) return null;
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return null;

  const [prof, sess, seen] = await Promise.all([
    supabase
      .from("profiles")
      .select("name,xp,streak,last_quiz_date,reminder_time")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("quiz_sessions")
      .select("id,date,questions,answers,score,total,xp_earned,completed_at")
      .eq("user_id", user.id),
    supabase
      .from("question_progress")
      .select("question_id,correct")
      .eq("user_id", user.id),
  ]);

  if (prof.error || !prof.data) return null;

  const p = prof.data as ProfileRow;
  const sessions = ((sess.data ?? []) as SessionRow[]).map((s) => ({
    id: s.id,
    date: s.date,
    questions: s.questions as UserProgress["sessions"][number]["questions"],
    answers: s.answers as UserProgress["sessions"][number]["answers"],
    score: s.score,
    total: s.total,
    xpEarned: s.xp_earned,
    completedAt: s.completed_at,
  }));

  const qp = (seen.data ?? []) as QuestionProgressRow[];
  return {
    name: p.name,
    email: user.email ?? "",
    xp: p.xp,
    streak: p.streak,
    lastQuizDate: p.last_quiz_date,
    answeredQuestionIds: qp.map((r) => r.question_id),
    missedQuestionIds: qp.filter((r) => !r.correct).map((r) => r.question_id),
    sessions,
    reminderTime: p.reminder_time,
  };
}

/** Upsert the full client progress to the server. Idempotent. */
export async function pushProgress(progress: UserProgress): Promise<boolean> {
  if (!supabase || !progress) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      name: progress.name,
      xp: progress.xp,
      streak: progress.streak,
      last_quiz_date: progress.lastQuizDate,
      reminder_time: progress.reminderTime ?? "08:00",
    },
    { onConflict: "id" },
  );

  const sessionRows = progress.sessions.map((s) => ({
    id: s.id,
    user_id: user.id,
    date: s.date,
    questions: s.questions,
    answers: s.answers,
    score: s.score,
    total: s.total,
    xp_earned: s.xpEarned,
    completed_at: s.completedAt,
  }));
  if (sessionRows.length) {
    await supabase
      .from("quiz_sessions")
      .upsert(sessionRows, { onConflict: "user_id,date" });
  }

  // Review-pool ledger. Last answer per question wins (matches client: a
  // question leaves the review pool once answered correctly). Practice
  // sessions run after daily ones, so a correct practice answer correctly
  // overrides an earlier miss.
  const seen = new Map<string, boolean>();
  for (const s of progress.sessions) {
    for (const a of s.answers) seen.set(a.questionId, a.correct);
  }
  for (const s of progress.practiceSessions ?? []) {
    for (const a of s.answers) seen.set(a.questionId, a.correct);
  }
  if (seen.size) {
    const rows = [...seen.entries()].map(([question_id, correct]) => ({
      user_id: user.id,
      question_id,
      correct,
    }));
    await supabase
      .from("question_progress")
      .upsert(rows, { onConflict: "user_id,question_id" });
  }

  return true;
}

/**
 * Serialized push. Pushes are fire-and-forget from the store; without a queue,
 * a slower answer() push could land AFTER the finishQuiz() push and leave the
 * server row looking uncompleted (breaks the daily gate on other devices).
 * Chaining guarantees uploads finish in the order they were enqueued.
 */
let pushChain: Promise<unknown> = Promise.resolve();
export function queuePush(progress: UserProgress): Promise<unknown> {
  pushChain = pushChain
    .then(() => pushProgress(progress))
    .catch(() => {
      /* offline / transient — next push retries the full state anyway */
    });
  return pushChain;
}
