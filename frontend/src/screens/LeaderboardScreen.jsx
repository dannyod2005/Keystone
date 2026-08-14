import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

import { PageHeader } from "../components/common/Primitives";

// #231 — global, opt-in leaderboard ranked by weekly learning minutes.
// Fetch-on-mount with a cancelled guard, same shape as
// CourseAnalyticsView's onFetchAnalytics effect — onFetchLeaderboard is
// recreated every App.jsx render, so it's deliberately left out of the
// dependency array.
export function LeaderboardScreen({ onFetchLeaderboard }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    onFetchLeaderboard()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load the leaderboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ks-page-enter" style={{ padding: "28px 32px 60px", maxWidth: 720, margin: "0 auto" }}>
      <PageHeader
        title="Leaderboard"
        subtitle="Ranked by learning minutes logged this week. Only learners who've opted in appear here."
      />

      {loading ? (
        <div className="ks-card" style={{ padding: 40, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
          Loading leaderboard…
        </div>
      ) : error ? (
        <div className="ks-card" style={{ padding: 24, fontSize: 13.5, color: "var(--coral)", textAlign: "center" }}>
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="ks-card" style={{ padding: 24, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
          No one has opted in yet. Opt in from your dashboard to be the first.
        </div>
      ) : (
        <div className="ks-card" style={{ padding: 0, overflow: "hidden" }}>
          {entries.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                borderBottom: i < entries.length - 1 ? "1px solid var(--line)" : "none",
                background: e.isSelf ? "var(--gold-tint)" : "transparent",
              }}
            >
              <div style={{
                width: 26, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 600,
                color: e.rank <= 3 ? "var(--gold-dark)" : "var(--slate-light)",
              }}>
                {e.rank}
              </div>
              {e.rank <= 3 ? <Trophy size={15} color="var(--gold-dark)" /> : <div style={{ width: 15 }} />}
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: e.isSelf ? 700 : 600 }}>
                {e.name}{e.isSelf ? " (you)" : ""}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--slate)" }}>
                {e.weeklyMinutes} min
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
