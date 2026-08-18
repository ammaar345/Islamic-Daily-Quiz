/**
 * SFX via Web Audio API — synthesized chimes, no audio assets needed.
 * Created lazily on first user gesture (browsers block audio before that).
 * All calls are safe no-ops if audio is unavailable.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.12,
) {
  const c = audio();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(
      0.0001,
      c.currentTime + start + duration,
    );
    osc.connect(g).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + duration + 0.05);
  } catch {
    /* no-op */
  }
}

/** Soft warm two-note chime for a correct answer. */
export function sfxCorrect() {
  tone(523.25, 0, 0.25); // C5
  tone(659.25, 0.08, 0.3); // E5
  tone(783.99, 0.16, 0.4); // G5
}

/** Gentle low tone for a wrong answer — soft, not punishing. */
export function sfxWrong() {
  tone(196, 0, 0.3, "triangle", 0.1); // G3
  tone(155.56, 0.12, 0.35, "triangle", 0.08); // D#3
}

/** Short rising arpeggio when the quiz is completed. */
export function sfxComplete() {
  tone(523.25, 0, 0.2);
  tone(659.25, 0.1, 0.2);
  tone(783.99, 0.2, 0.2);
  tone(1046.5, 0.3, 0.45); // C6
}

/** Bright rising fanfare on level up. */
export function sfxLevelUp() {
  tone(523.25, 0, 0.18);
  tone(659.25, 0.09, 0.18);
  tone(783.99, 0.18, 0.18);
  tone(1046.5, 0.27, 0.3);
  tone(1318.5, 0.36, 0.5, "sine", 0.09);
}
