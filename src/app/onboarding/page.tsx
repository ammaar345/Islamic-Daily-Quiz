"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuizStore } from "@/lib/store";
import { authMode } from "@/lib/auth";
import { cumulativeXpForLevel } from "@/lib/progress";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

type StartTier = "newbie" | "average" | "intermediate";

const TIERS: { id: StartTier; label: string; desc: string; xp: number }[] = [
  { id: "newbie", label: "I'm new to this", desc: "Start gentle with the essentials.", xp: 0 },
  {
    id: "average",
    label: "I know the basics",
    desc: "Begin at Average level (Level 11).",
    xp: cumulativeXpForLevel(11),
  },
  {
    id: "intermediate",
    label: "I'm comfortable",
    desc: "Begin at Intermediate level (Level 26).",
    xp: cumulativeXpForLevel(26),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const signIn = useQuizStore((s) => s.signIn);
  const [mode, setMode] = useState<"signUp" | "signIn">("signUp");
  // Sign-up fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<StartTier>("newbie");
  const [reminder, setReminder] = useState("08:00");
  // Shared state
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const demo = authMode() === "demo";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Please enter a valid email address.");
    if (password.length < 6)
      return setError("Use a password of at least 6 characters.");
    if (mode === "signUp" && !name.trim())
      return setError("Please enter your name.");

    setError("");
    setBusy(true);
    try {
      if (mode === "signUp") {
        const chosen = TIERS.find((t) => t.id === tier)!;
        const res = await signIn(name, email, password, chosen.xp, reminder);
        if (!res.ok) {
          setError(res.error ?? "Something went wrong. Please try again.");
          setBusy(false);
          return;
        }
      } else {
        // sign in only (no name/tier/reminder)
        const res = await signIn("", email, password, 0, "08:00");
        if (!res.ok) {
          setError(res.error ?? "Invalid email or password.");
          setBusy(false);
          return;
        }
      }
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass rounded-card p-6 sm:p-10"
      >
        <h1 className="font-display text-3xl font-bold text-ink">
          {mode === "signUp" ? "Create your account" : "Sign in to your account"}
        </h1>
        <p className="mt-2 text-ink-soft">
          Five questions a day. Grow your level, keep your streak.
        </p>

        {demo && mode === "signUp" && (
          <p className="mt-4 rounded-2xl bg-gold-soft/70 px-4 py-3 text-sm text-gold-deep">
            Demo mode — progress is saved on this device. Connect Supabase to
            enable real accounts and cross-device progress.
          </p>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setMode("signUp")}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-colors",
              mode === "signUp"
                ? "bg-primary text-primary-foreground"
                : "bg-surface/60 text-ink hover:bg-surface/80"
            )}
          >
            Sign up
          </button>
          <button
            onClick={() => setMode("signIn")}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-colors",
              mode === "signIn"
                ? "bg-primary text-primary-foreground"
                : "bg-surface/60 text-ink hover:bg-surface/80"
            )}
          >
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          {mode === "signUp" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">
                    Name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full rounded-2xl border border-border-soft bg-surface/80 px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-2xl border border-border-soft bg-surface/80 px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-primary"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-border-soft bg-surface/80 px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-primary"
                />
              </label>

              <fieldset>
                <legend className="mb-1.5 block text-sm font-semibold text-ink">
                  Where are you starting?
                </legend>
                <div className="grid gap-3">
                  {TIERS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTier(t.id)}
                      aria-pressed={tier === t.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                        tier === t.id
                          ? "border-primary/40 bg-primary-soft/60 shadow-soft"
                          : "border-border-soft bg-surface/60 hover:border-ink/25",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          tier === t.id ? "border-primary bg-primary" : "border-ink/20",
                        )}
                      >
                        {tier === t.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span>
                        <span className="block font-semibold text-ink">{t.label}</span>
                        <span className="block text-sm text-ink-soft">{t.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">
                  Daily reminder time
                </span>
                <input
                  type="time"
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                  className="w-full rounded-2xl border border-border-soft bg-surface/80 px-4 py-3 text-ink outline-none transition-colors focus:border-primary"
                />
              </label>
            </>
          )}

          {mode === "signIn" && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-border-soft bg-surface/80 px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-border-soft bg-surface/80 px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-primary"
                />
              </label>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-error">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Processing…" : mode === "signUp" ? "Create account" : "Sign in"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
