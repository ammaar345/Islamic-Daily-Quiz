"use client";

import { useState, useCallback, useEffect } from "react";
import { setPatchedDate, clearPatchedDate, getPatchedDate } from "@/lib/dev-time";
import { localDate, baseDate } from "@/lib/progress";
import { useQuizStore } from "@/lib/store";
import { cn } from "@/lib/cn";

const PRESETS: { label: string; value: () => Date }[] = [
  { label: "Now", value: () => new Date() },
  { label: "Yesterday", value: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d; } },
  { label: "2d ago", value: () => { const d = new Date(); d.setDate(d.getDate() - 2); return d; } },
  { label: "3d ago", value: () => { const d = new Date(); d.setDate(d.getDate() - 3); return d; } },
  { label: "+1d", value: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; } },
  { label: "+3d", value: () => { const d = new Date(); d.setDate(d.getDate() + 3); return d; } },
  { label: "+7d", value: () => { const d = new Date(); d.setDate(d.getDate() + 7); return d; } },
];

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState("");
  const resetProgress = useQuizStore((s) => s.resetProgress);

  const synced = getPatchedDate();

  useEffect(() => {
    if (synced) {
      const dateStr = localDate(synced);
      setPickerDate((current) => (current === dateStr ? current : dateStr));
    }
  }, [synced]);

  const applyPreset = useCallback((fn: () => Date) => {
    setPatchedDate(fn());
  }, []);

  const applyPicker = useCallback(() => {
    if (!pickerDate) return;
    setPatchedDate(new Date(pickerDate + "T12:00:00"));
  }, [pickerDate]);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 font-sans text-xs",
    )}>
      {open && (
        <div className="glass w-80 rounded-2xl p-4 shadow-lg">
          <p className="mb-2 font-semibold text-ink">
            {synced ? `Today is: ${localDate(synced)}` : "Real time"}
          </p>

          <div className="mb-3 grid grid-cols-4 gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.value)}
                className="rounded-lg bg-primary-soft px-2 py-1.5 text-primary-deep transition hover:bg-primary/20"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mb-3 flex gap-1">
            <input
              type="date"
              value={pickerDate}
              onChange={(e) => setPickerDate(e.target.value)}
              className="w-full rounded-lg border border-border-soft bg-surface px-2 py-1.5 text-ink"
            />
            <button
              onClick={applyPicker}
              className="rounded-lg bg-primary px-3 py-1.5 text-white"
            >
              Set
            </button>
          </div>

          <div className="space-y-1.5 border-t border-border-soft pt-2">
            <QuickAction label="Reset progress" onClick={resetProgress} danger />
            <QuickAction label="+500 XP" onClick={() => addXp(500)} />
            <QuickAction label="Add 7-day streak" onClick={() => buildStreak(7)} />
            <QuickAction label="Mark today done" onClick={markTodayDone} />
            <QuickAction label="Clear day override" onClick={clearPatchedDate} />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-lg"
      >
        {open ? "Close" : "Dev"}
      </button>
    </div>
  );
}

function QuickAction({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-3 py-1.5 text-left transition",
        danger
          ? "bg-error-soft text-error hover:bg-error/20"
          : "bg-gold-soft text-gold-deep hover:bg-gold/20",
      )}
    >
      {label}
    </button>
  );
}

/* ---------- helpers ---------- */

function addXp(amount: number) {
  const store = useQuizStore.getState();
  if (!store.progress) return;
  store.setProgress({ ...store.progress, xp: store.progress.xp + amount });
}

function buildStreak(days: number) {
  return () => {
    const store = useQuizStore.getState();
    if (!store.progress) return;
    const base = store.progress;
    const today = localDate();
    const sessions = [...base.sessions];

    // Build consecutive days ending at today (or patched today).
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = localDate(d);
      if (!sessions.some((s) => s.date === date && s.completedAt)) {
        sessions.push({
          id: `dev-streak-${date}`,
          date,
          answers: Array.from({ length: 5 }, () => ({
            questionId: `dev-${date}-${Math.random()}`,
            selectedIndex: 0,
            correct: true,
            pillar: "quran" as const,
            xpEarned: 10, // XP_CORRECT for streak 0
            answeredAt: new Date().toISOString(),
          })),
          score: 5,
          total: 5,
          xpEarned: 50,
          questions: [],
          completedAt: new Date().toISOString(),
        });
      }
    }

    store.setProgress({
      ...base,
      streak: days,
      lastQuizDate: today,
      sessions,
    });
  };
}

function markTodayDone() {
  const store = useQuizStore.getState();
  if (!store.progress) return;
  const today = localDate();
  const base = store.progress;
  if (base.sessions.some((s) => s.date === today && s.completedAt)) return;
  store.setProgress({
    ...base,
    sessions: [
      ...base.sessions,
      {
        id: `dev-today-${Date.now()}`,
        date: today,
        answers: [],
        score: 5,
        total: 5,
        xpEarned: 50,
        questions: [],
        completedAt: new Date().toISOString(),
      },
    ],
  });
}