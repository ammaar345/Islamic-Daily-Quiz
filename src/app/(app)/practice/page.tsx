"use client";

import { PracticePlayer } from "@/components/PracticePlayer";

export default function PracticePage() {
  return (
    <div className="animate-fade-up">
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-ink">
        Practice your mistakes
      </h1>
      <PracticePlayer />
    </div>
  );
}
