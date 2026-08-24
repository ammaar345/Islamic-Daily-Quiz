# Islamic Daily Quiz

A daily quiz for Quran, Hadith, and Seerah. Five questions a day, XP and
levels, streaks, three tiers (Newbie → Average → Intermediate). Website first,
structured so a native app can wrap it later.

Full product plan: [`PLAN.md`](PLAN.md) · project conventions: [`CLAUDE.md`](CLAUDE.md)

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Test

```bash
npm test        # logic smoke tests (levels, tiers, XP, streaks, quiz assembly)
npm run build   # production build + type check
```

## Modes

- **Demo mode (default):** runs with no backend. Accounts and progress are
  stored in the browser (localStorage). Works fully for trying the app.
- **Supabase mode:** copy `.env.local.example` to `.env.local`, add
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the auth
  + progress persistence layer activates.

## Structure

```
src/
  app/                  routes: landing, onboarding, dashboard, quiz
  components/           QuizPlayer, LevelRing, ConfettiBurst, TopNav, ui primitives
  lib/
    progress.ts         XP/level/streak/tier engine (pure, tested)
    quiz.ts             daily quiz assembly
    sfx.ts              Web Audio synthesized chimes
    store.ts            Zustand state + localStorage persistence
    questions/          the question bank (Quran, Hadith, Seerah)
  types.ts
```

## Content sourcing

Every question carries a `source` citation. Convention:

- **Quran** — stable surah:ayah numbering (Uthmanic mushaf).
- **Hadith** — book + exact hadith number (standard sunnah.com numbering, e.g.
  "Sahih al-Bukhari 8; Sahih Muslim 16"). Only well-known authentic narrations
  are used.
- **Seerah** — established prophetic biography (Ibn Hisham) and authentic hadith.

Questions flagged `confidence: "review"` (currently 3 of 63) need a second pass
by someone with Islamic knowledge before public release. Run `npm test` or check
`src/lib/questions/index.ts` for the review list.
