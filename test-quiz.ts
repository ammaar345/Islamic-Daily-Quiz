/**
 * Logic smoke test — run with: node --experimental-strip-types test-quiz.ts
 */
import {
  levelFromXp,
  cumulativeXpForLevel,
  tierFromLevel,
  applyAnswer,
  completeSession,
  xpForCorrect,
  isQuizDone,
} from "./src/lib/progress";
import { buildDailyQuiz, createSession } from "./src/lib/quiz";
import { questionBankStats } from "./src/lib/questions";
import type { UserProgress } from "./src/types";

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`ok  ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name} ${detail ?? ""}`);
  }
}

const base: UserProgress = {
  name: "T",
  email: "t@t.com",
  xp: 0,
  streak: 0,
  lastQuizDate: null,
  answeredQuestionIds: [],
  missedQuestionIds: [],
  sessions: [],
};

// Question bank
const stats = questionBankStats();
check("300 questions seeded", stats.total === 300, stats.total);
check("0 review-flagged items", stats.reviewCount === 0, stats.reviewCount);
check(
  "pillar targets met (110 quran / 110 hadith / 80 seerah)",
  stats.byPillar.quran === 110 &&
    stats.byPillar.hadith === 110 &&
    stats.byPillar.seerah === 80,
  stats.byPillar,
);

// Levels / tiers
check("xp 0 → level 1", levelFromXp(0).level === 1);
check("tier newbie at lvl 10", tierFromLevel(10) === "newbie");
check("tier average at lvl 11", tierFromLevel(11) === "average");
check("tier average at lvl 25", tierFromLevel(25) === "average");
check("tier intermediate at lvl 26", tierFromLevel(26) === "intermediate");
const xp11 = cumulativeXpForLevel(11);
check("cumulative xp for level 11", levelFromXp(xp11).level === 11, xp11);
check(
  "cumulative xp for level 26",
  levelFromXp(cumulativeXpForLevel(26)).level === 26,
);

// Quiz assembly
const quiz = buildDailyQuiz(base);
check("quiz has 5 questions", quiz.length === 5, quiz.length);
check(
  "quiz questions unique",
  new Set(quiz.map((q) => q.id)).size === 5,
);
check(
  "newbie quiz only newbie-tier questions",
  quiz.every((q) => q.tier === "newbie"),
  quiz.map((q) => q.tier),
);

// Review slot: a missed question must resurface in the next daily quiz.
// Regression: the old filter `!seen.has(q.id)` removed every missed question
// (all of them are also in answeredQuestionIds), so the review slot never filled.
const missed = {
  ...base,
  answeredQuestionIds: ["quran-001"],
  missedQuestionIds: ["quran-001"],
};
const quizWithReview = buildDailyQuiz(missed);
check(
  "missed question resurfaces in daily quiz",
  quizWithReview.some((q) => q.id === "quran-001"),
  quizWithReview.map((q) => q.id),
);

// XP math
check("correct at streak 0 gives 10", xpForCorrect(0) === 10);
check("correct at streak 3 gives 25", xpForCorrect(3) === 25);
check("streak bonus caps at 25 (total 35)", xpForCorrect(10) === 35);

// applyAnswer
const p = base;
let r = applyAnswer({ p, questionId: "quran-001", correct: true });
check("correct adds xp", r.next.xp === 10 && r.xpGained === 10);
check("correct clears review pool", r.next.missedQuestionIds.length === 0);
r = applyAnswer({ p, questionId: "quran-002", correct: false });
check("wrong adds to review pool", r.next.missedQuestionIds.includes("quran-002"));
let p2 = r.next;
r = applyAnswer({ p: p2, questionId: "quran-002", correct: false });
check("wrong adds to review pool", r.next.missedQuestionIds.includes("quran-002"));
p2 = r.next;
r = applyAnswer({ p: p2, questionId: "quran-002", correct: true });
check("re-correct removes from review pool", !r.next.missedQuestionIds.includes("quran-002"));

// Session + completion
let session = createSession(p, buildDailyQuiz(p), "2026-08-01");
check("session stores 5 questions", session.questions.length === 5);
check("session not done", isQuizDone({ ...p, sessions: [session] }) === false);
const done = { ...p, sessions: [session] };
session = { ...session, completedAt: new Date().toISOString() };
const completed = completeSession({ ...done, sessions: [session] }, session.id);
check("completion sets streak 1", completed.streak === 1, completed.streak);

// Next day: lastQuizDate set to real yesterday → completing today advances streak.
const y = new Date();
y.setDate(y.getDate() - 1);
const ystr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
const day2 = { ...completed, lastQuizDate: ystr };
const completed2 = completeSession(day2, session.id);
check("streak advances on consecutive day", completed2.streak === 2, completed2.streak);

// Gap breaks streak.
const gap = { ...completed, lastQuizDate: "2000-01-01" };
const completedGap = completeSession(gap, session.id);
check("gap resets streak to 1", completedGap.streak === 1, completedGap.streak);

console.log(failures === 0 ? "\nAll checks passed" : `\n${failures} checks FAILED`);
process.exit(failures === 0 ? 0 : 1);
