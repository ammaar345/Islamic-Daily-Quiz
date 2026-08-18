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
