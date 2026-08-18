import Link from "next/link";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const FEATURES = [
  {
    title: "One quiz a day",
    body: "Five short questions, about three minutes. Quran, Hadith, and Seerah rotate daily so you learn a little of everything.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 9h18" />
        <circle cx="12" cy="15" r="2" />
      </svg>
    ),
  },
  {
    title: "Level up as you learn",
    body: "Earn XP for every correct answer, keep a streak alive, and climb from Newbie to Average to Intermediate.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Built on authentic sources",
    body: "Every question cites its source — Quran surah and ayah, or Sahih hadith and biography references. No guesses, no invented content.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 5a3 3 0 0 1 3-3h13v18H7a3 3 0 0 0-3 3z" strokeLinejoin="round" />
        <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackgroundPattern />

      <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4">
        {/* Nav */}
        <header className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary-deep text-lg text-gold-soft">
              ✦
            </span>
            <span className="font-display text-lg font-bold text-ink">
              Islamic Daily Quiz
            </span>
          </div>
          <Link
            href="/onboarding"
            className="rounded-full border border-ink/15 bg-surface/60 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary-dark"
          >
            Start
          </Link>
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="animate-fade-up rounded-full bg-gold-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
            Quran · Hadith · Seerah
          </p>
          <h1 className="mt-6 max-w-3xl animate-fade-up font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
            Learn a little,
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-dark to-gold-deep bg-clip-text text-transparent">
              every single day.
            </span>
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-lg text-ink-soft">
            A short daily quiz that grows with you. Answer, level up, keep your
            streak — and always know where the answer comes from.
          </p>
          <div className="mt-10 flex animate-fade-up flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="relative inline-flex min-h-[48px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-primary to-primary-dark px-8 text-base font-semibold text-white shadow-soft transition-all duration-200 hover:shadow-lift hover:brightness-110 active:scale-[0.97]"
            >
              <span aria-hidden className="shine-sweep" />
              <span className="relative">Start today&apos;s quiz</span>
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-ink/15 bg-surface/60 px-8 text-base font-semibold text-ink transition-colors hover:border-primary hover:text-primary-dark"
            >
              See how it works
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 pb-20 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-primary-soft to-mint text-primary-deep">
                {f.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {f.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
