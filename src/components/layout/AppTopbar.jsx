import { Search, Bell } from "lucide-react";

export function AppTopbar({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", width: 260 }}>
          <Search size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 11 }} />
          <input className="ks-input" placeholder="Search courses" />
        </div>
        <Bell size={18} color="var(--slate)" />
      </div>
    </div>
  );
}