# Islamic Daily Quiz — Current State (2026-08-24)

## TODO — priority actions (2026-08-24)

Do these in order. 1–2 block launch; 3–5 should happen before or right after it.

1. **Verify Supabase auth + sync (LAUNCH BLOCKER — code done, never tested
   against a real backend, ~1 hour)**
   - Create a free project at supabase.com
   - SQL Editor → paste `supabase/migrations/001_initial_schema.sql` → run
   - Copy `.env.local.example` to `.env.local`, fill in
     `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `npm run dev` → sign up → do a quiz → reload → confirm progress
     persists; sign out/in on a second browser to confirm sync
   - Deploy to Vercel (free tier) with the env vars + `NEXT_PUBLIC_SITE_URL`
     set, and repeat the end-to-end test there

2. **Question-bank second pass (LAUNCH BLOCKER — religious accuracy)**
   - All 300 questions are `confidence:"high"` but only 3 ever got a real
     review by someone with Islamic knowledge
   - Have a knowledgeable person read `src/lib/questions/` and verify every
     citation: hadith numbers against sunnah.com, Quran surah:ayah, seerah
     claims. Fix or delete anything weak. Do not skip this.

3. **Set `NEXT_PUBLIC_SITE_URL` at deploy** — the share-your-score text and
   SEO metadata use it; the placeholder
   `https://islamic-daily-quiz.vercel.app` will 404 otherwise.

4. **Enable analytics (free)** — Vercel Analytics on the deploy. Without it
   there is no way to measure activation, D1/D7 retention, or onboarding
   drop-off.

5. **Cap stored sessions (~60)** — `progress.sessions` grows forever in
   localStorage (and syncs whole). After a year of daily use that is 365
   sessions per user. Trim to the last ~60 on load/save when sync is next
   touched.

Later (not launch-blocking): padded maskable PNG icon (current maskable entry
reuses the off-center SVG — round launchers may crop the crescent); true push
notifications (needs a push service; site-open reminders already work);
streak shield; CSP nonce hardening; leaderboard / premium decisions.

## Changes this session (2026-08-24)

Improvement pass — 5 features, each verified (npm test 32/32, eslint clean,
tsc clean, next build clean) and pushed as its own feature branch + main.

**Housekeeping**
- Committed previously-untracked files (docs, configs, `public/`, supabase
  migration) and the uncommitted 2026-08-19 timer-bar tweak. `.gitignore` now
  excludes `/.tmp-run/` and `*.backup`.

**Feature: sound mute toggle**
- `src/lib/sound.ts` — persisted zustand store (`idq-sound-v1`, default on).
- `src/lib/sfx.ts` — `audio()` returns null when muted, so every SFX call is
  a no-op.
- `src/components/SoundToggle.tsx` — volume icon button in TopNav next to
  ThemeToggle (`aria-pressed`).

**Feature: share your score**
- `src/components/ShareResult.tsx` — Web Share API with clipboard fallback
  ("Copied to clipboard" for 2s). Text: score, streak, site link.
- Wired into the QuizPlayer results card.

**Feature: streak milestone banner**
- `src/components/QuizPlayer.tsx` — gold banner on the results screen when
  the new streak hits 3/7/30/100 (the milestones promised in PLAN.md).

**Feature: PNG PWA icons (closes the install-prompt gap)**
- `scripts/generate-icons.mjs` (sharp, dev-only) rasterizes the SVG into
  `public/icons/icon-192.png`, `icon-512.png`, and `src/app/apple-icon.png`
  (180px, auto-emits the apple-touch-icon link). Rerun after editing the SVG.
- `src/app/manifest.ts` lists the PNGs first; SVG entries kept.
- Known polish item: the maskable entry still uses the raw SVG whose artwork
  is off-center — a dedicated padded maskable PNG would be safer on round
  launchers.

**Feature: 14-day activity strip**
- `src/components/ActivityStrip.tsx` + dashboard section — one cell per day,
  gold when a quiz was completed, with an n/14 completed count.

**Not addressed this session (still open)**
- See "TODO — priority actions" at the top of this file for the live list.

## Changes this session (2026-08-19)

**UI Improvement: Enhanced countdown timer visibility**
- `QuizPlayer.tsx` — Increased countdown timer bar height from `h-1` to `h-2` and adjusted opacity from `bg-ink/10` to `bg-ink/20` for better visibility on all screens, especially in bright environments.

## Changes this session (2026-08-18)

Lint-cleanup pass + first git push.

**Lint + rules-of-hooks fixes (`src/components/`)**
- `QuizPlayer.tsx` — restored the `useRef` and framer-motion hook imports that the `CountUp` component needs (had been removed in a prior edit; would have broken the build). Moved `lockedRef.current` / `finishedRef.current` updates out of the render body into a `useEffect` (fixes `react-hooks/refs`). Moved the per-question `setTimer` reset out of the countdown effect into the `advance()` next-question branch. Wrapped the timeout `choose(-1)` call inside `setInterval` so it cannot race the lockedRef guard.
- `PracticePlayer.tsx` — deferred `setBlocked(true)` via `Promise.resolve().then(...)` inside both the mount effect and the `reviewAgain()` handler to satisfy `react-hooks/set-state-in-effect` without losing the empty-pool / daily-gate UI.
- `src/lib/achievements.ts` — removed unused `tierFromLevel` import.

**Test fix (`test-quiz.ts`)**
- `let p = base` → `const p = base` (pre-existing `prefer-const`).
- Removed a dead/broken assertion `p2.xp === 10 && p2.xp === 10` that re-tested stale state from a wrong-answer call.

**Verification (clean)**
- `npx eslint "src/**/*.{ts,tsx}"` → 0 errors, 0 warnings.
- `npx next build` → compiled successfully, 12 static pages.
- `npm test` → all 32 logic checks pass.

**Git push**
- Initialised the repo, renamed branch to `main`, committed 51 source files (no `node_modules`, no `.next` — `.gitignore` was already correct).
- Created GitHub repo: [https://github.com/ammaar345/Islamic-Daily-Quiz](https://github.com/ammaar345/Islamic-Daily-Quiz) via `gh repo create Islamic-Daily-Quiz --public --source=. --remote=origin --push`.

**Out of scope, not touched**
- `.tmp-run/` is a stale compiled-artifact directory from earlier sandbox tests — untracked, not committed, left alone.
- Supabase verification, PWA/SEO verification, question-bank second pass — all still pending as noted below.

---

# Islamic Daily Quiz — Current State (2026-08-08)

## What this is
Experience-based daily quiz for Islamic knowledge — **Quran, Hadith, Seerah**.
One quiz per day (5 questions), XP + levels, three tiers: Newbie → Average → Intermediate.
Website first, app wrapper later.

**Full plan: `PLAN.md`** — read it before any work. This file is the current status.

## Locked decisions
- Platform: website (PWA-ready), native app wrapper later
- Progress: email accounts (Supabase Auth), sync across devices
- Monetization: none yet
- Content language: English (Arabic shown for verses/hadith)
- Quiz: 5 Qs/day, ~2-3 min, one attempt per day
- Tiers unlock by level: Newbie 1-10, Average 11-25, Intermediate 26+

## Stack
Next.js (App Router) + React + Tailwind + Framer Motion + Zustand
Supabase (Auth + Postgres + RLS) · Vercel · Web Audio SFX · next-pwa later

## Design
- Style: Liquid Glass premium, Islamic palette — tokens in `src/app/globals.css`
- primary `#0F766E`, gold accent `#D4AF37`, bg `#F7F5F0`, ink `#1E293B`
- Type: Playfair Display (headings) + Inter (body), Amiri for Arabic text
- Motion 150-300ms, transform/opacity only, respect prefers-reduced-motion

## Content sourcing (MANDATORY)
Every question cites a legitimate source:
- Quran: stable surah:ayah (Uthmanic mushaf)
- Hadith: book + exact hadith number (sunnah.com standard numbering)
- Seerah: established biography (Ibn Hisham) + authentic hadith
Never add fabricated or weakly-sourced content.
Items flagged `confidence:"review"` need an Islamic-knowledge second pass before public release.

## Build status

### Phase 1 — MVP core BUILT
Next.js app, 300-question sourced bank (Quran 110, Hadith 110, Seerah 80), progress engine (XP/level/streak/tiers),
quiz player with timer + explanations, dashboard, demo-mode auth (localStorage).
`tsc --noEmit` passes clean; manual structural checks pass (no dup ids, sources, or prompts).

### Phase 3 — Practice mode + achievements: CODE DONE, UNVERIFIED (2026-08-08)
Review-pool practice (/practice): separate `practiceSession` state so it never
touches the daily gate, XP, or streak. Correct answers clear questions from the
review pool; practice outcomes fold into question_progress via sync. No timer.
Files: `src/components/PracticePlayer.tsx`, `src/app/(app)/practice/page.tsx`,
practice actions in `src/lib/store.ts`, practiceSessions on UserProgress
(`src/types.ts`), sync fold in `src/lib/sync.ts`. TopNav + dashboard link added.

Achievements: 14 badges derived purely from progress (no schema, nothing to
sync — a badge is a pure function of current UserProgress, so "has ever
happened" badges re-evaluate against current state). `src/lib/achievements.ts`
(catalog + `computeAchievements`), `src/components/Achievements.tsx` (dashboard
grid: earned = gold/pillar accent, locked = dashed ghost). Groups: daily (first
quiz, perfect 5/5), streak (3/7/30-day, longest run of consecutive completed
quiz dates), progress (level 5, Average tier 11, Intermediate tier 26), mastery
(25 correct per pillar), practice (first session, pool cleared, 10 sessions).

### Phase 2 — Real accounts + sync: CODE COMPLETE, UNVERIFIED (2026-08-08)
Supabase auth + cross-device sync is wired at the code level. Verification is
BLOCKED: the sandbox can't run builds/tests right now (shell classifier down),
and the migration has not been applied to a real Supabase project.

What was built:
- `supabase/migrations/001_initial_schema.sql` — profiles / quiz_sessions /
question_progress tables, RLS (own-rows only), signup trigger (auto-creates
profile with starting_xp + reminder_time from signup metadata),
unique(user_id, date) as the server-side daily-gate backstop.
- `src/lib/sync.ts` — fetchServerProgress (pull) + pushProgress (idempotent
upsert of full client state) + queuePush (serialized pushes so an answer()
upload can't land after finishQuiz()'s and leave the session uncompleted).
- `src/lib/store.ts` — async signIn (try sign-in → else sign-up, handles email
confirmations), async signOut, hydrateProgress (resumes today's in-flight
session), daily-gate check in startQuiz, idempotency guard in answer(),
session stamping in finishQuiz(). Demo→real migration heuristic: richer local
demo progress pushes up on first sign-in.
- `src/app/(app)/layout.tsx` — session restore on load + onAuthStateChange
(sign-in hydrates, sign-out clears), booted gate for the /onboarding redirect.
- `src/app/onboarding/page.tsx` — async submit, real error messages.

TO VERIFY (when shell is back): `node --experimental-strip-types test-quiz.ts`,
`npm run build` (typecheck), then apply the migration to a real Supabase project
and run an end-to-end account test.

KNOWN MVP LIMITATIONS (documented in the migration): xp/streak are client-trusted
(a user could forge their own stats via the API — harmless, no leaderboard);
daily-gate date is client-local, not server-timezone aware.

## CRITICAL BUGS — FIXED (code done 2026-08-08, tests blocked by sandbox):

1. ~~Daily gate broken~~ — `store.ts` now seeds today's session stub into
`progress.sessions` on start, `finishQuiz()` stamps `completedAt`, so
`isQuizDone()` works. Server backstop: unique(user_id, date).
Files: `src/lib/store.ts`, `src/lib/sync.ts`

2. ~~CountUp animation broken~~ — `QuizPlayer.tsx` now subscribes the rendered
<span.motion.span> to the motion value via `useTransform` instead of reading `mv.get()` once.
File: `src/components/QuizPlayer.tsx`

3. ~~Mid-quiz reload double-XP~~ — `answer()` has an idempotency guard: an
already-answered question returns its stored outcome without re-awarding XP.
File: `src/lib/store.ts`

4. ~~Review slot never surfaced missed questions~~ — `buildDailyQuiz` filtered
the review slot by `!seen`, but every missed question is also in
answeredQuestionIds, so the pool could never fill. Removed the clause; added a
regression test (missed question must resurface in the daily quiz).
File: `src/lib/quiz.ts`, `test-quiz.ts`

5. ~~Results screen unreachable + null crash~~ — `finishQuiz()`/`finishPractice()`
null the session before the results view renders, so the results branch was
shadowed (or the view read `session.score` on null and crashed / spun forever).
Both players now snapshot the completed session into `result` state and render
results from it, with the results branch moved first.
Files: `src/components/QuizPlayer.tsx`, `src/components/PracticePlayer.tsx`

6. ~~Mobile nav showed Dashboard twice~~ — TopNav's bottom nav duplicated the
Dashboard entry. Deduped via a label-map over LINKS.
File: `src/components/TopNav.tsx`

Additional polish (2026-08-10): QuizPlayer resumes a mid-quiz reload at the
first unanswered question (lazy initializers) and shows a per-question timer
bar; both result screens got a "Practice mistakes" review-pool nudge.
Verification: `tsc --noEmit` clean after all edits. test-quiz/audit/_sim-store
compile to `.tmp-run/` and were verified consistent-by-inspection (bank counts
110/110/80, tier/Xp constants, review-slot logic), but execution was still
blocked by the shell-classifier outage — re-run `node .tmp-run/test-quiz.js`
(+ audit-questions, _sim-store) and `npm run build` once the classifier recovers.

## Blocking launch issues

- **Supabase auth + schema**: CODE WRITTEN (migration + auth wiring + sync, see Phase 2
above). Still blocks launch because it is UNVERIFIED — needs a real Supabase project,
the migration applied, and an end-to-end account test. Effort: M (verification/testing).

- **Question bank second pass**: the 3 review-flagged questions were cleared 2026-08-08
(Luqman = wise man per majority opinion; birth year softened to "around 570 CE"; ghazawat
explanation corrected from "~60 saraya" to "several dozen"). Full 300-question bank still
needs a comprehensive Islamic-knowledge pass before public release — only those 3 were reviewed.
The final 15 hadith additions (hadith-096..110) were each number-verified against sunnah.com
this session via the `"sunnah.com <book> <number> <keyword>"` search pattern; all 300 are
`confidence:"high"`. Verified: `tsc --noEmit` passes clean; id/source/prompt dedup checks
pass (no dup ids, hadith source numbers, or prompts). `npx tsx audit-questions.ts`,
`npx tsx _sim-store.ts`, and `npm run build` still need to run (shell classifier was
intermittently down at completion time).
Newbie tier has ~46 fresh Qs/pillar — no near-term exhaustion.

## Launch readiness gaps (not blocking MVP, but needed before public)

- **PWA**: PARTIAL, CODE DONE (2026-08-08), unverified. Manifest
(`src/app/manifest.ts`), service worker (`public/sw.js`, network-first pages +
cache-first `_next/static`), SVG icon (`public/icons/icon.svg` + `src/app/icon.svg`
favicon), theme-color + apple-web-app metadata. Registered via
`src/components/PWAInit.tsx` (prod-only) in root layout. Remaining: PNG
192/512 + apple-touch-icon for full install prompts on iOS/older Chrome.
- **SEO**: CODE DONE (2026-08-08), unverified. `src/lib/site.ts` (SITE_URL —
set `NEXT_PUBLIC_SITE_URL` at deploy), per-route metadata via thin server
layouts (dashboard/quiz/practice/onboarding), OG/Twitter metadata + title
template in root layout, branded 1200x630 social card (`src/app/opengraph-image.tsx`,
rendered server-side via next/og), JSON-LD WebApplication on landing,
robots.txt + sitemap.xml, SVG favicon (`src/app/icon.svg`). Remaining: PNG
192/512 + apple-touch-icon, real analytics (activation/D1/D7).
- **next.config.ts**: NOW has security headers (CSP with 'unsafe-inline' scripts
pending nonce hardening, X-Frame-Options DENY, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy). No analytics yet — cannot measure
activation, D1/D7 retention, onboarding drop-off.
- **Dark mode**: CODE DONE (2026-08-08), unverified. Class-based (`html.dark`)
theme flipping the CSS-variable tokens in `src/app/globals.css` — surfaces,
ink, glass, and shadows adapt without per-component edits. Theme state
(`light`/`dark`/`system`, persisted `idq-theme-v1`) in `src/lib/theme.ts`,
applied by `src/components/ThemeProvider.tsx` + a pre-paint bootstrap script
in root layout (no flash). Toggle: `src/components/ThemeToggle.tsx` in TopNav
(3-state cycle, icon = effective theme). Landing page uses the OS default
only — no toggle there yet.
- **Daily reminders**: browser-notification reminder at the user's `reminderTime` —
fires while the site is open (works in a background tab), asks permission once,
skips the message if today's quiz is already done. True push (device closed)
still needs a push service. Files: `src/components/DailyReminder.tsx`, mounted in
`src/app/(app)/layout.tsx`.

## NOT done (from original plan)
- Real Supabase auth (email/password, sync across devices) — code written, unverified, see Phase 2
- Review pool / "mistakes" practice mode — DONE (code) 2026-08-08, see Phase 3
- Achievements / badges — DONE (code, unverified), 2026-08-08
- PWA push notifications (install + site-open reminders done; device-closed push pending)
- Daily reminder (email/push) at user-chosen time
- Full question bank (300 total) — DONE 2026-08-08; second-pass review still pending
- Leaderboard (optional, opt-in)
- Premium tier (deferred)

## User-selected improvement priority (2026-08-08)
1. Fix core bugs (daily gate + CountUp + mid-quiz reload) — CODE DONE, tests blocked by sandbox
2. Real accounts + sync (Supabase auth + RLS) — CODE DONE (Phase 2), needs verification
3. Practice mode + achievements (DONE, unverified)
4. Fix 3 review-flagged questions (DONE) → expand bank to 300 (DONE, 2026-08-08)
5. PWA + daily reminders — CODE DONE (unverified)
6. SEO + launch assets — CODE DONE (unverified)
7. Dark mode — CODE DONE (unverified)