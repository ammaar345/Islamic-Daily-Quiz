"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SoundState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

/** User sound preference. Defaults to on; persisted locally (not synced). */
export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: "idq-sound-v1" },
  ),
);

/** Non-hook read for non-React callers (sfx.ts). */
export function isSoundEnabled(): boolean {
  return useSoundStore.getState().enabled;
}
