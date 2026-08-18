import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Revisit questions you missed — no timer, no pressure, no XP lost.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
