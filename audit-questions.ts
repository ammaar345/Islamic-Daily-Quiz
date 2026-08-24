/**
 * Data-integrity audit + newbie fresh-pool exhaustion simulation.
 * Run: npx tsx audit-questions.ts
 */
import { ALL_QUESTIONS, questionBankStats } from "./src/lib/questions";
import { buildDailyQuiz } from "./src/lib/quiz";
import {
  levelFromXp,
  tierFromLevel,
  applyAnswer,
} from "./src/lib/progress";
import type { Pillar, Tier, Question, UserProgress } from "./src/types";

/* ---------------- 1. Static structural checks ---------------- */
const PILLARS: Pillar[] = ["quran", "hadith", "seerah"];
const TIERS: Tier[] = ["newbie", "average", "intermediate"];
const CONFIDENCE_OK = new Set(["high", "review"]);

const issues: { q: string; msg: string }[] = [];
const add = (q: string, msg: string) => issues.push({ q, msg });

const idSeen = new Map<string, Question>();
const promptSeen = new Map<string, string>();
const sourceSeen = new Map<string, string[]>();

for (const q of ALL_QUESTIONS) {
  if (idSeen.has(q.id)) add(q.id, `DUPLICATE id (also used by ${idSeen.get(q.id)!.id})`);
  idSeen.set(q.id, q);

  if (!PILLARS.includes(q.pillar)) add(q.id, `invalid pillar "${q.pillar}"`);
  if (!TIERS.includes(q.tier)) add(q.id, `invalid tier "${q.tier}"`);
  if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 5)
    add(q.id, `invalid difficulty "${q.difficulty}" (must be int 1..5)`);
  if (!CONFIDENCE_OK.has(q.confidence)) add(q.id, `invalid confidence "${q.confidence}"`);

  if (!Array.isArray(q.options) || q.options.length !== 4)
    add(q.id, `expected 4 options, got ${q.options?.length}`);
  else {
    const trimmed = q.options.map((o) => (typeof o === "string" ? o.trim() : `[${typeof o}]`));
    const dups = trimmed.filter((o, i) => trimmed.indexOf(o) !== i);
    if (dups.length > 0) add(q.id, `duplicate option strings: ${JSON.stringify([...new Set(dups)])}`);
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3)
      add(q.id, `answerIndex ${q.answerIndex} out of range [0,3]`);
  }

  for (const f of ["prompt", "explanation", "source"] as const) {
    const v = q[f];
    if (typeof v !== "string" || v.trim().length === 0) add(q.id, `${f} is empty`);
  }

  const p = q.prompt.trim().toLowerCase();
  if (promptSeen.has(p)) add(q.id, `DUPLICATE prompt (also ${promptSeen.get(p)})`);
  promptSeen.set(p, q.id);

  const holders = sourceSeen.get(q.source.trim()) ?? [];
  holders.push(q.id);
  sourceSeen.set(q.source.trim(), holders);
}

console.log(`Total questions: ${ALL_QUESTIONS.length}`);
const stats = questionBankStats();
console.log(`byPillar: ${JSON.stringify(stats.byPillar)}  byTier: ${JSON.stringify(stats.byTier)}  review: ${stats.reviewCount}`);

console.log("\nPer-tier-per-pillar counts:");
const grid: Record<string, number> = {};
for (const t of TIERS) for (const p of PILLARS) grid[`${t}/${p}`] = 0;
for (const q of ALL_QUESTIONS) grid[`${q.tier}/${q.pillar}`] += 1;
for (const t of TIERS) {
  const cells = PILLARS.map((p) => `${p}=${grid[`${t}/${p}`]}`);
  const total = PILLARS.reduce((a, p) => a + grid[`${t}/${p}`], 0);
  console.log(`  ${t.padEnd(12)} ${cells.join("  ")}   total=${total}`);
}

console.log("\nDifficulty ranges per tier (drives the 'elevated' slot):");
for (const t of TIERS) {
  const diffs = ALL_QUESTIONS.filter((q) => q.tier === t).map((q) => q.difficulty);
  const ge4 = ALL_QUESTIONS.filter((q) => q.tier === t && q.difficulty >= 4).length;
  console.log(`  ${t.padEnd(12)} min=${Math.min(...diffs)} max=${Math.max(...diffs)}  difficulty>=4: ${ge4}`);
}

console.log("\nReview-flagged items:");
for (const q of ALL_QUESTIONS.filter((q) => q.confidence === "review"))
  console.log(`  ${q.id}  tier=${q.tier}  ${q.prompt.slice(0, 64)}`);

const aiDist = ALL_QUESTIONS.reduce((a, q) => (a[q.answerIndex] += 1, a), [0, 0, 0, 0]);
console.log(`\nanswerIndex distribution across bank: ${JSON.stringify(aiDist)}`);

console.log("\nShared source strings (may be legit, e.g. seerah citing Ibn Hisham):");
for (const [src, ids] of sourceSeen) if (ids.length > 1) console.log(`  "${src}" ×${ids.length}  ${ids.join(", ")}`);

console.log(`\n${issues.length} structural issue(s):`);
for (const i of issues) console.log(`  - [${i.q}] ${i.msg}`);
if (issues.length === 0) console.log("  (none)");

/* ---------------- 2. Newbie fresh-pool exhaustion simulation ---------------- */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function freshUser(): UserProgress {
  return { name: "T", email: "t@t.com", xp: 0, streak: 0, lastQuizDate: null, answeredQuestionIds: [], missedQuestionIds: [], sessions: [] };
}

const TRIALS = 500;
const allNewbieIds = ALL_QUESTIONS.filter((q) => q.tier === "newbie").map((q) => q.id);

const results = {
  exhaustDay: [] as number[],            // first day ALL 21 newbie ids have been served at least once
  crossTierDay: [] as number[],          // first day a cross-tier (avg/int) question appeared
  repeatDay: [] as number[],             // first day an already-seen question was re-served
  avgFreshPerDayEarly: [] as number[],   // avg fresh-newbie count across days 1..3
};

for (let trial = 0; trial < TRIALS; trial++) {
  Math.random = mulberry32(1000 + trial);
  let p = freshUser();
  const seenNewbie = new Set<string>();
  const seenAll = new Set<string>();
  let day = 0;
  let exhaust = 0, cross = 0, repeat = 0;
  const freshFirst3: number[] = [];

  // play up to 14 simulated days (perfect play: all correct, so no review pool)
  while (day < 14) {
    day += 1;
    const quiz = buildDailyQuiz(p);
    const tier = tierFromLevel(levelFromXp(p.xp).level);

    let freshToday = 0;
    for (const q of quiz) {
      if (q.tier === "newbie" && !seenNewbie.has(q.id)) { freshToday += 1; seenNewbie.add(q.id); }
      if (!seenAll.has(q.id)) seenAll.add(q.id);
      if (q.tier !== tier && cross === 0) cross = day;
      if (p.answeredQuestionIds.includes(q.id) && repeat === 0) repeat = day;
    }
    if (day <= 3) freshFirst3.push(freshToday);
    if (seenNewbie.size === allNewbieIds.length && exhaust === 0) exhaust = day;

    // perfect play: all correct, no misses
    for (const q of quiz) p = applyAnswer({ p, questionId: q.id, correct: true }).next;
    // consecutive-day streak bookkeeping is irrelevant to pool selection; keep xp only.
  }
  results.exhaustDay.push(exhaust === 0 ? 14 : exhaust);
  results.crossTierDay.push(cross === 0 ? 14 : cross);
  results.repeatDay.push(repeat === 0 ? 14 : repeat);
  results.avgFreshPerDayEarly.push(freshFirst3.reduce((a, b) => a + b, 0) / Math.min(freshFirst3.length, 3));
}

const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const min = (a: number[]) => Math.min(...a);
const max = (a: number[]) => Math.max(...a);
const pct = (a: number[], cond: (n: number) => boolean) => `${(a.filter(cond).length / a.length * 100).toFixed(1)}%`;

console.log(`\n=== Newbie fresh-pool simulation (${TRIALS} seeded trials, perfect play) ===`);
console.log(`Newbie-tier questions: ${allNewbieIds.length}  |  intended fresh rate: 3/day → naive horizon ${(allNewbieIds.length / 3).toFixed(1)} days`);
console.log(`Fresh newbie questions per day (days 1-3): avg ${avg(results.avgFreshPerDayEarly).toFixed(2)} (min ${min(results.avgFreshPerDayEarly)}, max ${max(results.avgFreshPerDayEarly)})`);
console.log(`Day the ${allNewbieIds.length}-question newbie pool is exhausted: median ${avg(results.exhaustDay).toFixed(1)}, min ${min(results.exhaustDay)}, max ${max(results.exhaustDay)}`);
console.log(`  exhausted within 5 days: ${pct(results.exhaustDay, (n) => n <= 5)}`);
console.log(`  exhausted within 7 days: ${pct(results.exhaustDay, (n) => n <= 7)}`);
console.log(`First day a CROSS-TIER (average/intermediate) question is served: median ${avg(results.crossTierDay).toFixed(1)}`);
console.log(`  by day 6: ${pct(results.crossTierDay, (n) => n <= 6)}`);
console.log(`First day an ALREADY-SEEN question is re-served: median ${avg(results.repeatDay).toFixed(1)}`);
console.log(`  by day 5: ${pct(results.repeatDay, (n) => n <= 5)}`);
