import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start",
  description:
    "Set up your daily quiz in about a minute — name, starting level, and a reminder time.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
