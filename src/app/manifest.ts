import type { MetadataRoute } from "next";

/** Web App Manifest — served at /manifest.webmanifest. Makes the app installable. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Islamic Daily Quiz",
    short_name: "Daily Quiz",
    description:
      "A daily quiz for Quran, Hadith, and Seerah. Learn a little, every day.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#0F766E",
    lang: "en",
    icons: [
      // PNG 192/512 are required for Chrome install prompts (SVG-only fails).
      // Regenerate via: node scripts/generate-icons.mjs
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
