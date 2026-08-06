import { BookOpen, LayoutGrid, Home as HomeIcon, Pencil, LogOut } from "lucide-react";
import { LEARNER } from "../../data/courses";

/* ---------- Logged-in app shell ---------- */

export function AppSidebar({ screen, onGo, role, onLogout }) {
  const items = [
    { key: "dashboard", label: "My learning", icon: LayoutGrid },
    { key: "catalogue", label: "Catalogue", icon: BookOpen },
    { key: "home", label: "Discover", icon: HomeIcon },
  ];
  if (role === "trainer") {
    items.push({ key: "trainer", label: "Trainer studio", icon: Pencil });
  }
  return (
    <aside style={{ width: 220, flexShrink: 0, background: "var(--ink)", color: "var(--paper)", padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4, minHeight: "100vh" }}>        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px 22px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2 L21 8 V22 H15 V14 H9 V22 H3 V8 Z" fill="var(--gold)" /></svg>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--paper)" }}>Keystone</span>
      </div>
      {items.map((it) => {
        const Icon = it.icon;
        const active = screen === it.key;
        return (
          <div key={it.key} onClick={() => onGo(it.key)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: active ? "var(--ink)" : "var(--paper)", background: active ? "var(--gold-tint)" : "transparent" }}>
            <Icon size={16} color={active ? "var(--gold-dark)" : "var(--paper)"} />
            {it.label}
          </div>
        );
      })}
      <hr style={{ border: "none", borderTop: "1px solid #FFFFFF22", margin: "16px 4px" }} />
      <div style={{ padding: "0 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--gold)", color: "#2B1E06", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>AC</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--paper)" }}>{LEARNER.name}</div>
          <div style={{ fontSize: 11, color: "#B9C0CC" }}>{role === "trainer" ? "Trainer account" : LEARNER.goal}</div>
        </div>
      </div>
      {onLogout && (
        <div
          onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#B9C0CC", marginTop: 8 }}
        >
          <LogOut size={16} color="#B9C0CC" />
          Log out
        </div>
      )}
    </aside>
  );
}