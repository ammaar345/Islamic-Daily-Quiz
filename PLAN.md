# Islamic Daily Quiz — Product Plan

Status: Planning complete — ready for build
Date: 2026-08-01
Owner: sneaky

## 1. Vision

An experience-based daily quiz for Islamic knowledge — Quran, Hadith, and Seerah.
Users get one short quiz per day, gain XP, level up, and climb three tiers:
Newbie → Average → Intermediate. Made to feel special: sound effects, celebratory
motion, streaks, and a premium elegant look. Website first, structured so a native
app can wrap it later.

## 2. Decisions Locked

| Decision | Choice |
|---|---|
| Platform | Website (PWA-ready), app wrapper later |
| Progress | Email accounts, progress syncs across devices |
| Monetization | None yet (ads/premium deferred to later phase) |
| Language | English (Arabic shown for verses/hadith) |
| Quiz length | 5 questions per day, ~2-3 minutes (tunable flag) |
| Content pillars | Quran, Hadith, Seerah |
| Tiers | Newbie, Average, Intermediate |

## 3. Core Loop

```
Sign up → Pick tier → Daily quiz (5 Qs) → Answers + explanations
       → XP + streak → Level up / tier up → Return tomorrow
```

- One quiz per day, gate enforced server-side.
- Every question is followed by a short explanation + source (for learning, not
  just scoring).
- Wrong answers go into a review pool and resurface in future quizzes.

## 4. Tiers & Progression

| Tier | Level range | Question difficulty |
|---|---|---|
| Newbie | 1-10 | Famous facts, well-known verses, basic pillars, common hadith |
| Average | 11-25 | Deeper verses, hadith context, seerah events, sunnah details |
| Intermediate | 26-50 | Cross-references, rare seerah, fiqh context, graded hadith |

Progression rules:
- Correct answer = +10 XP.
- Streak bonus: +5 XP per streak day, capped at +25.
- Level cost = `level × 50` XP. Level 1→2 needs 50 XP, 2→3 needs 100, etc.
- Reaching level 11 and 26 unlocks the next tier's question pool.
- Tier is informative, not a lock-out — users can still get questions from lower
  tiers to keep confidence.

## 5. Daily Quiz Mechanics

- **Length:** 5 questions. Target 2-3 min total. Backend flag `quizLength` so it
  can be tuned to 5/7/10 without code changes.
- **Composition:** mixes pillars by day — e.g. 2 Quran, 2 Hadith, 1 Seerah,
  rotated so every pillar appears in each weekly cycle.
- **Question mix:** 3 fresh + 1 from review pool (missed questions) + 1
  difficulty-elevated if user is performing above tier.
- **Timer:** gentle per-question countdown (45s default, tunable) for the
  "experience" feel. No harsh penalty on timeout — question just counts wrong.
- **Daily gate:** 1 attempt per day. No same-day retry. Streak is the incentive
  to come back daily.

## 6. Streaks & Retention

- Streak = consecutive days with a completed quiz.
- Daily reminder (email now, push notification after PWA stage) at user-chosen time.
- Streak shown as a flame/ember motif; milestone toasts at 3/7/30/100 days.
- Missed day resets streak to 0 (grace: "streak shield" for 1 day/month — later phase).

## 7. Features

### MVP (Phase 1)
- Email signup / login (password)
- Onboarding: name, tier self-selection, reminder time
- Daily quiz player (one question at a time, explanation after each)
- XP, level, streak, tier state
- Dashboard: "Today's quiz" card, progress bars, streak flame, level ring
- Basic SFX + celebration on correct answers and quiz completion

### Later
- Review pool / "mistakes" section with practice mode
- Achievements / badges
- PWA install + push notifications
- Leaderboard (optional, opt-in)
- Premium tier (ads-free, extra features) — only when monetization decided

## 8. Design Direction (ui-ux-pro-max)

Style basis: **Liquid Glass** (premium, elegant, fluid) with a custom Islamic
palette — the skill's default slate/blue is replaced with brand tokens.

### Palette (design tokens)
| Token | Value |
|---|---|
| `--brand-primary` | `#0F766E` (deep teal-emerald) |
| `--brand-gold` | `#D4AF37` (accent / streak / correct) |
| `--bg` | `#F7F5F0` (warm ivory) |
| `--surface` | `#FFFFFF` glass, `rgba(255,255,255,0.6)` + blur |
| `--ink` | `#1E293B` (foreground) |
| `--error` | `#DC2626` (wrong answer) |
| `--success` | `#15803D` (correct answer) |

### Typography
- Headings: Playfair Display (elegant serif)
- Body/UI: Inter
- Arabic text: Amiri (verses, hadith text) — with English translation
- Type scale: 12 / 14 / 16 / 18 / 24 / 32 / 48; body 16px, line-height 1.6

### Motion (all 150-300ms, transform/opacity only, respects reduced-motion)
- Correct answer: gold particle burst + scale pop on the option + soft chime
- Wrong answer: gentle shake on option, red flash, then reveal explanation
- Quiz completion: level ring fills, XP counter counts up, streak flame ignites
- Level up: full celebration overlay (Arabic-pattern confetti, "Level Up" title)
- Screen transitions: fade + slight vertical drift, spatial continuity

### Visual motifs (no slop)
- Islamic geometric star / lattice SVG patterns as subtle background texture
- Arch (mihrab) shaped cards and the daily-quiz entry card
- Thin gold linework, generous whitespace
- SVG icons only (Lucide), no emoji as icons
- Contrast ≥ 4.5:1, visible focus states, touch targets ≥ 44px, keyboard nav

## 9. Screens & Flow

1. Landing — hero, features, CTA
2. Auth — signup / login (email + password)
3. Onboarding — name, tier pick, reminder time
4. Dashboard — daily quiz card (locked if done), streak, level ring, tier progress
5. Quiz player — question card, options, timer, progress dots
6. Explanation — after each answer, with source
7. Results — score, XP earned, level status, celebration
8. Profile / progress — stats, history, streak, mistakes list
9. Review mode — practice missed questions (later phase)

## 10. Tech Stack

- Frontend: Next.js (App Router) + React + Tailwind CSS
- Animation: Framer Motion (micro-interactions, celebration effects)
- State: Zustand (UI state) — server truth in Supabase
- Auth + DB: Supabase (email/password auth, Postgres, Row-Level Security)
- Sound: small MP3 SFX via Howler.js, or Web Audio API synthesized chimes
- Hosting: Vercel
- PWA (later): next-pwa for install + push
- App wrapper (later): Capacitor — one codebase, wrap to iOS/Android

## 11. Data Model

- `users` — id, email, name, tier, xp, level, streak, last_quiz_date, reminder_time, created_at
- `questions` — id, pillar (quran|hadith|seerah), tier (newbie|average|intermediate),
  difficulty (1-5), prompt, options (jsonb), answer_index, explanation, source,
  arabic_text (nullable), active
- `quiz_sessions` — id, user_id, date, questions (jsonb order), score, xp_earned, completed_at
- `answers` — id, session_id, user_id, question_id, selected_index, correct, xp, created_at
- `review_pool` — id, user_id, question_id, missed_count, last_seen_at, due_at
- `achievements` / `user_achievements` (later)

Rules:
- `quiz_sessions` unique per (user_id, date) — enforces daily gate.
- RLS: users read/write only their own rows.

## 12. Content Plan

### Question bank targets (launch)
| Pillar | Newbie | Average | Intermediate | Total |
|---|---|---|---|---|
| Quran | 40 | 40 | 30 | 110 |
| Hadith | 40 | 40 | 30 | 110 |
| Seerah | 30 | 30 | 20 | 80 |
| **Total** | | | | **300** |

### Authoring format per question
- Prompt, 4 options, 1 correct, short explanation, source citation.
- Sources: Quran (surah:ayah), hadith (book + number, e.g. Bukhari 12), Seerah
  (event + reference).
- Hadith: prefer Sahih sources (Bukhari, Muslim); note grading where relevant.
- Accuracy gate: every batch reviewed by someone with Islamic knowledge before
  release. No fabricated or weak claims.

### Content tooling
- Questions seeded as structured JSON → migration into Supabase.
- Simple content importer so new banks can be added without code.

## 13. Build Phases

### Phase 1 — MVP (core loop)
Auth, onboarding, question seed (~120 Qs), daily quiz player, XP/level/streak,
dashboard, basic SFX + celebration. Deploy to Vercel.

### Phase 2 — Polish & retention
Review pool + practice mode, achievements, streak milestones, richer effects,
PWA install + push reminders, reminder emails.

### Phase 3 — App ready
Capacitor wrapper → iOS/Android builds. Optional leaderboards.

### Phase 4 — Monetization (deferred)
Ads or premium tier — only when decided.

## 14. Open Questions
- Reminder time default (propose 08:00 local, user-chosen).
- Full question bank content source: write in-house vs licensed/purchased.
- Whether leaderboards matter — privacy (opt-in) either way.
