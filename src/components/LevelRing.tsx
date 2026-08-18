"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  level: number;
  intoLevel: number;
  cost: number;
  tier: string;
  size?: number;
}

export function LevelRing({ level, intoLevel, cost, tier, size = 150 }: Props) {
  const reduce = useReducedMotion();
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, intoLevel / cost);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track — warm cream */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-cream)"
          strokeWidth={11}
        />
        {/* Progress — emerald gradient with soft gold cap */}
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-gold)" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? { strokeDashoffset: c * (1 - pct) } : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: "drop-shadow(0 0 6px rgb(201 153 46 / 0.4))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          Level
        </span>
        <span className="font-display text-4xl font-bold text-ink">{level}</span>
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-deep">
          {tier}
        </span>
      </div>
    </div>
  );
}
