export function AppTopbar({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "18px 32px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, margin: 0 }}>{title}</h1>
    </div>
  );
}