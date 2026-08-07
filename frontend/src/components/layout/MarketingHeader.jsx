import { LogIn } from "lucide-react";

export function MarketingHeader({ onGo, onAuth }) {
  return (
    <header style={{ borderBottom: "1px solid var(--line)", background: "var(--paper-2)", position: "sticky", top: 0, zIndex: 20 }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <div onClick={() => onGo("home")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2 L21 8 V22 H15 V14 H9 V22 H3 V8 Z" fill="var(--ink)" /></svg>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>Keystone</span>
          </div>
          <nav style={{ display: "flex", gap: 24 }}>
            <span onClick={() => onGo("home")} style={{ fontSize: 14, fontWeight: 500, cursor: "pointer", color: "var(--slate)" }}>Discover</span>
            <span onClick={() => onGo("catalogue")} style={{ fontSize: 14, fontWeight: 500, cursor: "pointer", color: "var(--slate)" }}>Catalogue</span>
          </nav>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="ks-btn ks-btn-ghost" onClick={() => onAuth("login")}><LogIn size={15} /> Log in</button>
          <button className="ks-btn ks-btn-gold" onClick={() => onAuth("signup")}>Join for free</button>
        </div>
      </div>
    </header>
  );
}