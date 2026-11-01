/** Soft drifting gold light specks. Decorative, hidden when reduced motion is requested. */
export function Particles({ count = 16 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${(i * 37 + 11) % 100}%`, bottom: `${(i * 23) % 40}%`,
            width: 3 + ((i * 5) % 6), height: 3 + ((i * 5) % 6),
            ["--dur" as string]: `${10 + ((i * 3) % 9)}s`, ["--delay" as string]: `${-(i * 1.7) % 12}s`,
            ["--dx" as string]: `${((i % 2 ? 1 : -1) * (14 + i * 2))}px`,
          }}
        />
      ))}
    </div>
  );
}

export function Ornament({ tone = "gold" }: { tone?: "gold" | "light" }) {
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-4 py-2">
      <span className={`h-px w-24 ${tone === "gold" ? "bg-gold/60" : "bg-champagne/50"}`} />
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none" stroke="#c6a15b" strokeWidth="2"><rect x="9" y="9" width="22" height="22" /><rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" /></svg>
      <span className={`h-px w-24 ${tone === "gold" ? "bg-gold/60" : "bg-champagne/50"}`} />
    </div>
  );
}
