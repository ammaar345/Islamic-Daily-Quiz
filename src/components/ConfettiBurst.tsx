"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const COLORS = [
  "var(--color-gold)",
  "var(--color-primary)",
  "var(--color-gold-soft)",
  "var(--color-primary-dark)",
  "#d8b64f",
];

/** Warm emerald + gold particle burst. id=0 renders nothing; new id replays. */
export function ConfettiBurst({ id }: { id: number }) {
  const reduce = useReducedMotion();
  const parts = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 70 + (i % 4) * 22;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 26,
          color: COLORS[i % COLORS.length],
          size: 7 + (i % 3) * 3,
          round: i % 3 === 0,
        };
      }),
    [],
  );

  if (reduce || id === 0) return null;

  return (
    <div
      key={id}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
    >
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className={p.round ? "absolute left-1/2 top-1/2 rounded-full" : "absolute left-1/2 top-1/2 rounded-[3px]"}
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 1.15, rotate: 340 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
