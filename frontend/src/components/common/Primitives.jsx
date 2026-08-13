import { Star } from "lucide-react";
/* ---------- small pieces ---------- */

// #103 — Keystone brand mark: a "K" built from a bar + two keystone-wedge
// triangles (fixed gold accent — same idea as an architectural keystone
// wedge, doubling as the K's diagonal strokes). Unlike the old single-fill
// house/doorway glyph it replaces, this one is deliberately two-tone and
// NOT recolorable via a single `fill` prop, so it takes a `variant` instead:
// "dark" for use on ink/dark surfaces (bar renders in paper), "light" for
// use on paper/light surfaces (bar renders in ink). The gold wedges stay
// gold in both cases, matching the app's ink-background/gold-accent scheme.
export function KeystoneMark({ variant = "light", size = 22 }) {
  const barColor = variant === "dark" ? "var(--paper)" : "var(--ink)";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="3" width="3.5" height="18" rx="1" fill={barColor} />
      <polygon points="9,3 19,3 11,11.3" fill="var(--gold)" />
      <polygon points="9,21 19,21 11,12.7" fill="var(--gold)" />
    </svg>
  );
}

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
