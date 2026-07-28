/* ---------- small pieces ---------- */

export function Stars({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={12} fill={n <= Math.round(rating) ? "var(--gold)" : "none"} color="var(--gold)" />
      ))}
    </span>
  );
}

export function KeystoneArch({ progress = 0, size = 44 }) {
  // 5 voussoir segments forming a simple arch; fills gold left-to-right by progress
  const segs = 5;
  const filled = Math.round(progress * segs);
  const w = size, h = size * 0.62;
  const segW = w / segs;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {Array.from({ length: segs }).map((_, i) => {
        const x = i * segW;
        const isFilled = i < filled;
        const t = i / (segs - 1);
        const lift = Math.sin(t * Math.PI) * (h * 0.32);
        return (
          <rect key={i} x={x + 1} y={h - h * 0.55 - lift} width={segW - 2} height={h * 0.55}
            rx={2} fill={isFilled ? "var(--gold)" : "var(--line)"} />
        );
      })}
    </svg>
  );
}

export function CategoryDot({ color }) {
  const map = { ink: "var(--ink)", gold: "var(--gold)", success: "var(--success)", coral: "var(--coral)" };
  return <span style={{ width: 7, height: 7, borderRadius: 99, background: map[color], display: "inline-block" }} />;
}
