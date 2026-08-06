import { useState } from "react";
import { Search } from "lucide-react";

import { Stars, CategoryDot } from "../components/common/Primitives";
import { MarketingHeader } from "../components/layout/MarketingHeader";

export function CatalogueScreen({ loggedIn, onGo, onOpenCourse, onAuth, enrolledIds, courses }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const cats = ["All", "Technical", "Business", "Leadership"];

  const byCategory = filter === "All" ? courses : courses.filter((c) => c.category === filter);
  const query = search.trim().toLowerCase();
  const filtered = query
    ? byCategory.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.provider.toLowerCase().includes(query),
      )
    : byCategory;

  return (
    <div>
      {!loggedIn && <MarketingHeader onGo={onGo} onAuth={onAuth} />}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 60px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, margin: "0 0 6px" }}>Course catalogue</h1>
        <p style={{ color: "var(--slate)", fontSize: 14, margin: "0 0 22px" }}>{courses.length} courses across technical, business, and leadership tracks.</p>

        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 11 }} />
            <input
              className="ks-input"
              placeholder="Search by title or provider"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {cats.map((c) => (
              <span key={c} onClick={() => setFilter(c)}
                style={{ fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 100, cursor: "pointer",
                  background: filter === c ? "var(--ink)" : "var(--paper-2)", color: filter === c ? "var(--paper)" : "var(--slate)",
                  border: "1px solid var(--line)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="ks-card" style={{ padding: 24, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
            No courses match "{search}".
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {filtered.map((c) => {
              const isEnrolled = enrolledIds.includes(c.id);
              return (
                <div key={c.id} className="ks-card" onClick={() => onOpenCourse(c)} style={{ padding: 18, cursor: "pointer", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CategoryDot color={c.color} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{c.category}</span>
                    </div>
                    {isEnrolled && <span className="ks-badge" style={{ background: "var(--success-tint)", color: "var(--success)" }}>Enrolled</span>}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{c.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginBottom: 10 }}>{c.provider}</div>
                  <div style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{c.blurb}</div>
                  <hr className="ks-hairline" style={{ margin: "0 0 12px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Stars rating={c.rating} />
                    <span style={{ fontSize: 12, color: "var(--slate-light)", fontFamily: "var(--font-mono)" }}>{c.hours}h · {c.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}