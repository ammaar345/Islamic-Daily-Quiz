"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import type { QuizSession } from "@/types";
import { useQuizStore, useLevelInfo } from "@/lib/store";
import { isQuizDone } from "@/lib/progress";
import { sfxComplete, sfxCorrect, sfxLevelUp, sfxWrong } from "@/lib/sfx";
import { ConfettiBurst } from "./ConfettiBurst";
import { PillarTag } from "./PillarTag";
import { ShareResult } from "./ShareResult";
import { Button } from "./ui/Button";
import { cn } from "@/lib/cn";

const PER_QUESTION_SECONDS = 45;

// useTransform subscribes the rendered <motion.span> to the motion value,
// so the number animates when mv changes. Previously used mv.get() in a
// static span which reads once at mount and never updates visually.
function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();
  const display = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.9, ease: "easeOut" });
    return controls.stop;
  }, [value, mv, reduce]);

  return <motion.span>{display}</motion.span>;
}

export function QuizPlayer() {
  const progress = useQuizStore((s) => s.progress);
  const session = useQuizStore((s) => s.currentSession);
  const startQuiz = useQuizStore((s) => s.startQuiz);
  const answer = useQuizStore((s) => s.answer);
  const finishQuiz = useQuizStore((s) => s.finishQuiz);
  const levelInfo = useLevelInfo();

  // Resume mid-quiz after a reload: the persisted store already holds the
  // in-flight session, so jump to the first unanswered question and reveal
  // its state if it was already answered (e.g. all questions done but the
  // session never finished). Lazy initializers read the store once on mount.
  const firstUnanswered = () => {
    const s = useQuizStore.getState().currentSession;
    if (!s || s.answers.length === 0) return 0;
    return Math.min(s.answers.length, Math.max(0, s.questions.length - 1));
  };
  const [idx, setIdx] = useState(firstUnanswered);
  const [selected, setSelected] = useState<number | null>(() => {
    const s = useQuizStore.getState().currentSession;
    if (!s || s.answers.length === 0) return null;
    const q = s.questions[firstUnanswered()];
    if (!q) return null;
    return s.answers.find((a) => a.questionId === q.id)?.selectedIndex ?? null;
  });
  const [locked, setLocked] = useState(() => {
    const s = useQuizStore.getState().currentSession;
    if (!s || s.answers.length === 0) return false;
    const q = s.questions[firstUnanswered()];
    if (!q) return false;
    return s.answers.some((a) => a.questionId === q.id);
  });
  const [burst, setBurst] = useState(0);
  const [anyLevelUp, setAnyLevelUp] = useState(false);
  const [finished, setFinished] = useState(false);
  // Snapshot of the completed session. finishQuiz() nulls store.currentSession
  // immediately, so the results view must render from this snapshot, not the
  // live store value (which is null by then).
  const [result, setResult] = useState<QuizSession | null>(null);
  const [timer, setTimer] = useState(PER_QUESTION_SECONDS);

  const lockedRef = useRef(locked);
  const finishedRef = useRef(finished);

  // Keep refs up to date without updating during render
  useEffect(() => {
    lockedRef.current = locked;
    finishedRef.current = finished;
  }, [locked, finished]);

  // Start the session once on mount.
  useEffect(() => {
    if (!session) startQuiz();
  }, [session, startQuiz]);

  const q = session?.questions[idx];

  const choose = useCallback(
    (i: number) => {
      if (lockedRef.current || !session) return;
      const target = session.questions[idx];
      if (!target) return;
      setSelected(i);
      setLocked(true);
      const out = answer(target.id, i);
      if (!out) return;
      if (out.correct) {
        setBurst((b) => b + 1);
        sfxCorrect();
      } else {
        sfxWrong();
      }
      if (out.leveledUp) setAnyLevelUp(true);
    },
    [answer, idx, session],
  );

  // Per-question countdown. On timeout (v <= 1) the question is answered as a
  // miss via choose(-1) — no harsh penalty, it just counts wrong and reveals
  // the explanation. The guard on lockedRef makes this idempotent across the
  // interval tick and any stale closure.
  useEffect(() => {
    if (locked || finished || !session) return;
    const t = setInterval(() => {
      setTimer((v) => {
        if (v <= 1) {
          clearInterval(t);
          if (!lockedRef.current) choose(-1);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // choose is recreated with the current idx/session; the guard above keeps
    // the closure safe, so it is intentionally excluded from the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, locked, finished, session]);

  const advance = () => {
    if (!session) return;
    if (idx < session.questions.length - 1) {
      setIdx((i) => i + 1);
      setSelected(null);
      setLocked(false);
      setBurst(0);
      setTimer(PER_QUESTION_SECONDS); // reset the countdown for the next question
      return;
    }
    if (anyLevelUp) sfxLevelUp();
    sfxComplete();
    setResult(session);
    finishQuiz();
    setFinished(true);
  };

  /* ---- Results (rendered from the session snapshot) ---- */
  if (result) {
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
          {result.score === result.total
            ? "Perfect!"
            : result.score >= result.total * 0.6
              ? "Well done"
              : "Good effort"}
        </motion.p>
        <p className="mt-1 text-ink-soft">
          {result.score} of {result.total} correct
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-gradient-to-b from-primary-soft to-mint p-4">
            <p className="text-2xl font-bold text-primary-deep">
              +<CountUp value={result.xpEarned} />
            </p>
            <p className="text-xs font-medium text-ink-soft">XP earned</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-b from-gold-soft to-mint p-4">
            <p className="text-2xl font-bold text-gold-deep">
              <CountUp value={progress?.streak ?? 0} />
            </p>
            <p className="text-xs font-medium text-ink-soft">Day streak</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-b from-cream to-mint p-4">
            <p className="text-2xl font-bold text-ink">
              <CountUp value={levelInfo?.level ?? 1} />
            </p>
            <p className="text-xs font-medium text-ink-soft">Level</p>
          </div>
        </div>

        {anyLevelUp && (
          <motion.p
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="mt-5 inline-block animate-glow-pulse rounded-full bg-gradient-to-b from-gold to-gold-deep px-5 py-2 text-sm font-bold text-white"
          >
            Level up! You reached level {levelInfo?.level}
          </motion.p>
        )}

        {result.answers.some((a) => !a.correct) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25, ease: "easeOut" }}
            className="mt-5 rounded-2xl bg-mint/70 p-4 text-left"
          >
            <p className="font-semibold text-primary-dark">
              {result.answers.filter((a) => !a.correct).length} question
              {result.answers.filter((a) => !a.correct).length === 1 ? "" : "s"}{" "}
              went into your review pool.
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Drill them anytime — no timer, no XP at stake.
            </p>
            <Link href="/practice" className="mt-3 inline-block w-full">
              <Button variant="outline" className="w-full">
                Practice mistakes
              </Button>
            </Link>
          </motion.div>
        )}

        <div className="mt-6">
          <ShareResult
            score={result.score}
            total={result.total}
            streak={progress?.streak ?? 0}
          />
        </div>

        <Link href="/dashboard" className="mt-3 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </motion.div>
    );
  }

  /* ---- Already completed today ---- */
  if (progress && isQuizDone(progress) && !session) {
    return (
      <div className="glass mx-auto max-w-md rounded-card p-8 text-center animate-fade-up">
        <p className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-success to-success/80 text-2xl text-white shadow-soft">
          ✓
        </p>
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">
          Daily quiz done
        </h2>
        <p className="mt-2 text-ink-soft">
          You&apos;ve completed today&apos;s quiz. Come back tomorrow to keep
          your streak alive.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  /* ---- Loading / not started ---- */
  if (!session || !q) {
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
      {/* Progress */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          {session.questions.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === idx
                  ? "w-6 bg-gradient-to-r from-primary to-gold"
                  : i < idx
                    ? "w-3 bg-gold"
                    : "w-3 bg-ink/15",
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold tabular-nums transition-colors",
            timer <= 10 && !locked
              ? "bg-error-soft text-error"
              : "bg-mint text-primary-dark",
          )}
        >
          {timer}s
        </span>
      </div>

      {/* Time remaining bar — drains once per second, snaps off when locked */}
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-ink/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-gold transition-[width] duration-1000 ease-linear"
          style={{
            width: `${
              locked || finished ? 0 : (timer / PER_QUESTION_SECONDS) * 100
            }%`,
          }}
        />
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
          <ConfettiBurst id={burst} />

          <div className="flex items-center justify-between">
            <PillarTag pillar={q.pillar} />
            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Question {idx + 1} of {session.questions.length}
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

          {/* Explanation */}
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
                <Button
                  className="mt-4 w-full"
                  onClick={advance}
                >
                  {idx < session.questions.length - 1 ? "Next question" : "See results"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}