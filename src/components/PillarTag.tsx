import type { Pillar } from "@/types";
import { cn } from "@/lib/cn";

const map: Record<Pillar, { label: string; cls: string }> = {
  quran: { label: "Quran", cls: "bg-primary-soft text-primary-deep" },
  hadith: { label: "Hadith", cls: "bg-gold-soft text-gold-deep" },
  seerah: { label: "Seerah", cls: "bg-cream text-ink-soft" },
};

export function PillarTag({ pillar, className }: { pillar: Pillar; className?: string }) {
  const m = map[pillar];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        m.cls,
        className,
      )}
    >
      {m.label}
    </span>
  );
}
