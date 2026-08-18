import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today's Quiz",
  description:
    "Five questions on Quran, Hadith, and Seerah. One shot per day.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
