import { ArrowRight, ChevronRight} from "lucide-react";

import { TESTIMONIALS } from "../data/courses";
import { Stars, KeystoneArch, CategoryDot } from "../components/common/Primitives";
import { MarketingHeader } from "../components/layout/MarketingHeader";

/* ---------- Screen: Home (marketing) ---------- */

export function HomeScreen({ onGo, onAuth, courses, loggedIn }) {
  return (
    <div>
      {!loggedIn && <MarketingHeader onGo={onGo} onAuth={onAuth} />}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "64px 28px 40px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
        <div>
          <span className="ks-badge" style={{ background: "var(--gold-tint)", color: "var(--gold-dark)" }}>For growing teams</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 46, lineHeight: 1.08, margin: "18px 0 16px" }}>
            Skills your team can point to, not just talk about.
          </h1>
          <p style={{ fontSize: 16, color: "var(--slate)", lineHeight: 1.6, maxWidth: 460 }}>
            Short, project-based courses in AI, data, and leadership — built so a busy person can actually finish them.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
            <button className="ks-btn ks-btn-gold" style={{ padding: "12px 22px", fontSize: 15 }} onClick={() => onAuth("signup")}>Get started free</button>
            <button className="ks-btn ks-btn-ghost" style={{ padding: "12px 22px", fontSize: 15 }} onClick={() => onGo("catalogue")}>
              Browse catalogue <ArrowRight size={15} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 34 }}>
            {[["40,000+", "learners"], ["120+", "courses"], ["4.8", "avg. rating"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 20 }}>{n}</div>
                <div style={{ fontSize: 12, color: "var(--slate-light)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="ks-card" style={{ padding: 22, position: "relative" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>Continue where you left off</div>
          {courses.slice(0, 3).map((c) => (
            <div key={c.id} onClick={() => onGo("catalogue")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 10, cursor: "pointer" }}>
              <KeystoneArch progress={c.id === "c1" ? 0.62 : c.id === "c2" ? 0.1 : 0.2} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "var(--slate-light)" }}>{c.provider}</div>
              </div>
              <ChevronRight size={15} color="var(--slate-light)" />
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "20px 28px 56px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, margin: 0 }}>Popular this month</h2>
          <span onClick={() => onGo("catalogue")} style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gold-dark)", cursor: "pointer" }}>View catalogue →</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {courses.slice(0, 3).map((c) => (
            <div key={c.id} className="ks-card" onClick={() => onGo("catalogue")} style={{ padding: 18, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <CategoryDot color={c.color} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{c.category}</span>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5, marginBottom: 14 }}>{c.blurb}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Stars rating={c.rating} />
                <span style={{ fontSize: 12, color: "var(--slate-light)" }}>{c.hours}h</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--ink)", padding: "56px 28px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, color: "var(--paper)", marginBottom: 22 }}>What learners say</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ background: "#1E2C4A", border: "1px solid #2A3A5C", borderRadius: 14, padding: 20 }}>
                <Stars rating={t.rating} />
                <p style={{ color: "#DDE2EA", fontSize: 14, lineHeight: 1.55, margin: "12px 0 16px" }}>{t.quote}</p>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--paper)" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#8B93A0" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px", textAlign: "center", fontSize: 12.5, color: "var(--slate-light)" }}>
        Keystone Learning — clickable prototype for demo purposes.
      </footer>
    </div>
  );
}