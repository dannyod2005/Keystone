import { Menu } from "lucide-react";

// #104 — hamburger is mobile-only (md:hidden); on md+ this renders nothing
// and the topbar is pixel-identical to before this issue.
export function AppTopbar({ title, onMenuClick }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 32px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
      {onMenuClick && (
        <Menu
          size={22}
          color="var(--ink)"
          className="cursor-pointer md:hidden"
          onClick={onMenuClick}
        />
      )}
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, margin: 0 }}>{title}</h1>
    </div>
  );
}
