/**
 * Cozy ambient backdrop: soft Islamic eight-point-star lattice over warm
 * emerald + champagne glow blobs. Fixed behind everything.
 */
export function BackgroundPattern() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Emerald glow, top center */}
      <div className="glow-blob -top-24 left-1/2 h-[420px] w-[640px] -translate-x-1/2 bg-primary-soft" />

      {/* Champagne glow, bottom right */}
      <div className="glow-blob -bottom-32 -right-20 h-[380px] w-[480px] bg-gold-soft" />

      {/* Deep green glow, bottom left */}
      <div className="glow-blob -bottom-24 -left-24 h-[360px] w-[460px] bg-primary-soft/80" />

      {/* Lattice */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]">
        <defs>
          <pattern id="star-lattice" width="88" height="88" patternUnits="userSpaceOnUse">
            <path
              d="M44 6 L54 34 L82 34 L60 52 L70 82 L44 64 L18 82 L28 52 L6 34 L34 34 Z"
              fill="none"
              stroke="var(--color-primary-dark)"
              strokeWidth="1.5"
            />
            <path
              d="M44 88 L44 82 M44 0 L44 6 M88 44 L82 44 M0 44 L6 44"
              stroke="var(--color-primary-dark)"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#star-lattice)" />
      </svg>

      {/* Soft vignette so edges settle into the page */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg/70" />
    </div>
  );
}
