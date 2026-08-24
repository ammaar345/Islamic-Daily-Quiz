"use client";

import { useSoundStore } from "@/lib/sound";

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M11 5 6 9H3v6h3l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
      {muted ? (
        <>
          <path d="m16.5 9.5 5 5" strokeLinecap="round" />
          <path d="m21.5 9.5-5 5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
          <path d="M18.5 6a9 9 0 0 1 0 12" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** Toggles quiz sound effects on/off. Persisted per device. */
export function SoundToggle() {
  const enabled = useSoundStore((s) => s.enabled);
  const setEnabled = useSoundStore((s) => s.setEnabled);

  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      title={enabled ? "Sound: on. Click to mute." : "Sound: off. Click to unmute."}
      aria-label={enabled ? "Mute sound effects" : "Unmute sound effects"}
      aria-pressed={enabled}
      className="cursor-pointer rounded-full p-2 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
    >
      <VolumeIcon muted={!enabled} />
    </button>
  );
}
