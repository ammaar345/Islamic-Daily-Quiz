/** Site-wide constants for SEO / PWA / sharing. */

/** Canonical origin. Set NEXT_PUBLIC_SITE_URL at deploy; placeholder until then. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://islamic-daily-quiz.vercel.app";

export const SITE_NAME = "Islamic Daily Quiz";
export const SITE_DESCRIPTION =
  "A daily quiz for Quran, Hadith, and Seerah. Learn a little, every day.";
export const SITE_TAGLINE = "Quran · Hadith · Seerah — a little, every day";
