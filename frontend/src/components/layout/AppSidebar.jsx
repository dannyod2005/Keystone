import { BookOpen, LayoutGrid, Home as HomeIcon, Pencil, LogOut, X } from "lucide-react";
import { LEARNER } from "../../data/courses";
import { getDisplayName, getInitials } from "../../lib/userDisplay";
import { KeystoneMark } from "../common/Primitives";

/* ---------- Logged-in app shell ---------- */

// #104 — off-canvas on mobile (< md), a normal in-flow sidebar on md+.
// mobileOpen/onCloseMobile only matter below md; the md: classes below
// override them back to a static, always-visible sidebar exactly like
// before this issue, so desktop is unaffected. Position/visibility live
// on Tailwind classes (the one thing inline style={{}} genuinely can't
// express — media queries); everything else (color, padding, layout)
// stays as the existing inline styles, unchanged.
export function AppSidebar({ screen, onGo, role, onLogout, user, mobileOpen = false, onCloseMobile }) {
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const items = [
    { key: "dashboard", label: "My learning", icon: LayoutGrid },
    { key: "catalogue", label: "Catalogue", icon: BookOpen },
    { key: "home", label: "Discover", icon: HomeIcon },
  ];
  if (role === "trainer") {
    items.push({ key: "trainer", label: "Trainer studio", icon: Pencil });
  }
  return (
    <>
      {/* Backdrop: mobile only, tap to dismiss. Never rendered on md+. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 md:static md:translate-x-0 md:z-auto ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 220, flexShrink: 0, background: "var(--ink)", color: "var(--paper)", padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4, minHeight: "100vh" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 10px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeystoneMark variant="dark" size={20} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--paper)" }}>Keystone</span>
          </div>
          <X size={18} color="var(--paper)" className="cursor-pointer md:hidden" onClick={onCloseMobile} />
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
          <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--gold)", color: "#2B1E06", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--paper)" }}>{displayName}</div>
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
    </>
  );
}