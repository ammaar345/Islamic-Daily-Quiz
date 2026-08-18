"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { QuizSession } from "@/types";
import { useQuizStore } from "@/lib/store";
import { PillarTag } from "./PillarTag";
import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";

/**
 * Practice mode: re-drill the review pool (missedQuestionIds). No timer,
 * no XP, no streak, no daily gate — answer until the pool is clean.
 */
export function PracticePlayer() {
  const progress = useQuizStore((s) => s.progress);
  const practiceSession = useQuizStore((s) => s.practiceSession);
  const startPractice = useQuizStore((s) => s.startPractice);
  const practiceAnswer = useQuizStore((s) => s.practiceAnswer);
  const finishPractice = useQuizStore((s) => s.finishPractice);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [blocked, setBlocked] = useState(false);
  // Snapshot of the completed session. finishPractice() nulls
  // store.practiceSession immediately, so the results view must render from
  // this snapshot, not the live store value (which is null by then).
  const [result, setResult] = useState<QuizSession | null>(null);

  // Start a practice session on mount (or on revisit after finishing).
  useEffect(() => {
    if (practiceSession || finished) return;
    const ok = startPractice();
    if (!ok) {
      Promise.resolve().then(() => setBlocked(true));
    }
  }, [practiceSession, finished, startPractice]);

  const q = practiceSession?.questions[idx];

  const choose = useCallback(
    (i: number) => {
      if (locked || !practiceSession) return;
      const target = practiceSession.questions[idx];
      if (!target) return;
      setSelected(i);
      setLocked(true);
      practiceAnswer(target.id, i);
    },
    [locked, idx, practiceSession, practiceAnswer],
  );

  const advance = () => {
    if (!practiceSession) return;
    if (idx < practiceSession.questions.length - 1) {
      setIdx((i) => i + 1);
      setSelected(null);
      setLocked(false);
      return;
    }
    setResult(practiceSession);
    finishPractice();
    setFinished(true);
  };

  const reviewAgain = () => {
    setResult(null);
    setFinished(false);
    setIdx(0);
    setSelected(null);
    setLocked(false);
    setBlocked(false);
    const ok = startPractice();
    if (!ok) Promise.resolve().then(() => setBlocked(true));
  };

  /* ---- Results (rendered from the session snapshot) ---- */
  if (result) {
    const score = result.score;
    const total = result.total;
    const poolLeft = progress?.missedQuestionIds.length ?? 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass mx-auto max-w-md rounded-card p-8 text-center"
      >
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
          className="font-display text-3xl font-bold text-ink"
        >
          {score === total ? "Pool cleared!" : score >= Math.ceil(total / 2) ? "Solid review" : "Keep drilling"}
        </motion.p>
        <p className="mt-1 text-ink-soft">
          {score} of {total} correct
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          {poolLeft === 0
            ? "You cleared every question in your review pool. Nice work."
            : `${poolLeft} question${poolLeft === 1 ? "" : "s"} still in your review pool.`}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {poolLeft > 0 && (
            <Button variant="outline" onClick={reviewAgain}>
              Review again
            </Button>
          )}
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  /* ---- No questions to review / daily quiz in progress ---- */
  if (!practiceSession && blocked) {
    const poolEmpty = (progress?.missedQuestionIds.length ?? 0) === 0;
    return (
      <div className="glass mx-auto max-w-md rounded-card p-8 text-center animate-fade-up">
        <p className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-mint to-primary-soft text-2xl text-primary-deep">
          {poolEmpty ? "✦" : "✧"}
        </p>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">
          {poolEmpty ? "Review pool is clear" : "Finish today's quiz first"}
        </h2>
        <p className="mt-2 text-ink-soft">
          {poolEmpty
            ? "No mistakes to revisit. Keep taking the daily quiz and any missed questions will appear here for review."
            : "Practice starts from your review pool. Complete today's daily quiz, then come back to drill the questions you missed."}
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  /* ---- Loading / not started ---- */
  if (!practiceSession || !q) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/10 border-t-primary" />
      </div>
    );
  }

  /* ---- Question ---- */
  const optionState = (i: number) => {
    if (!locked) return "idle";
    if (i === q.answerIndex) return "correct";
    if (i === selected) return "wrong";
    return "dim";
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <span className="rounded-full bg-gold-soft px-3 py-1 text-sm font-semibold text-gold-deep">
          Practice · review pool
        </span>
        <span className="text-sm font-semibold text-ink-soft tabular-nums">
          {idx + 1} of {practiceSession.questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="glass relative rounded-card p-6 sm:p-8"
        >
          <div className="flex items-center justify-between">
            <PillarTag pillar={q.pillar} />
            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              No time limit · no XP
            </span>
          </div>

          {q.arabic && (
            <p className="mt-5 text-right font-arabic text-2xl leading-relaxed text-primary-dark">
              {q.arabic}
            </p>
          )}

          <h2 className="mt-4 font-display text-xl font-bold leading-snug text-ink sm:text-2xl">
            {q.prompt}
          </h2>

          <div className="mt-6 grid gap-3">
            {q.options.map((opt, i) => {
              const st = optionState(i);
              return (
                <button
                  key={i}
                  disabled={locked}
                  onClick={() => choose(i)}
                  className={cn(
                    "group flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left font-medium transition-all duration-200",
                    st === "idle" &&
                      "border-border-soft bg-gradient-to-b from-surface/90 via-mint/40 to-gold-soft/25 hover:border-primary/40 hover:from-mint hover:via-primary-soft/50 hover:to-primary-soft/60 hover:shadow-soft",
                    st === "correct" &&
                      "border-success/40 bg-gradient-to-b from-success-soft via-mint to-success-soft/70 text-success motion-safe:animate-pop",
                    st === "wrong" &&
                      "border-error/40 bg-gradient-to-b from-error-soft via-surface to-error-soft/70 text-error motion-safe:animate-[shake_0.4s_ease]",
                    st === "dim" && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                      st === "idle" &&
                        "bg-ink/5 text-ink-soft group-hover:bg-primary group-hover:text-white",
                      st === "correct" && "bg-success text-white",
                      st === "wrong" && "bg-error text-white",
                      st === "dim" && "bg-ink/5 text-ink-soft",
                    )}
                  >
                    {st === "correct"
                      ? "✓"
                      : st === "wrong"
                        ? "✕"
                        : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {locked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-warm mt-5 rounded-2xl p-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-gold-deep">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
                      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.5 1 2.5h6c0-1 .3-1.9 1-2.5A6 6 0 0 0 12 3z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Why this answer
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    {q.explanation}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-deep">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M4 5a3 3 0 0 1 3-3h13v18H7a3 3 0 0 0-3 3z" strokeLinejoin="round" />
                      <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
                    </svg>
                    Source: {q.source}
                  </p>
                </div>
                <Button className="mt-4 w-full" onClick={advance}>
                  {idx < practiceSession.questions.length - 1 ? "Next question" : "See results"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}