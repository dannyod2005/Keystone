import { KeystoneMark } from "../common/Primitives";

// #337 — single site-wide footer, rendered once from AppShell so every
// routed page (Dashboard, Catalogue, Learning, Leaderboard, Trainer
// Studio, Settings, Home) gets it for free instead of each screen
// wiring its own. Replaces the old logged-out-only "clickable
// prototype for demo purposes" line that used to live in HomeScreen.
//
// Privacy/GDPR and About Us don't have real pages yet — building them
// is called out in the issue as a separate follow-up. Those two links
// are intentionally inert (muted text, no onClick/href) rather than
// pointing at a route that doesn't exist and silently bouncing back to
// Home via the app's catch-all redirect. Swap in real onGo() calls
// once those pages ship.
export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40 }}>
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "22px 28px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <KeystoneMark size={16} />
          <span style={{ fontSize: 12.5, color: "var(--slate-light)" }}>
            &copy; {new Date().getFullYear()} Keystone Learning &middot; Singapore
          </span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <span title="Coming soon" style={{ fontSize: 12.5, color: "var(--slate-light)", cursor: "default" }}>
            Privacy &amp; GDPR
          </span>
          <span title="Coming soon" style={{ fontSize: 12.5, color: "var(--slate-light)", cursor: "default" }}>
            About us
          </span>
        </div>
      </div>
    </footer>
  );
}
