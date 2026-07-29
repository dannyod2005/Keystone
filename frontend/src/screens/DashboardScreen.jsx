import { PlayCircle, CheckCircle2, Award, ChevronLeft, ChevronRight, Flame } from "lucide-react";

import { LEARNER } from "../data/courses";
import { KeystoneArch } from "../components/common/Primitives";
/* ---------- Screen: Dashboard ---------- */

export function DashboardScreen({ enrolled, onOpenCourse, onStartLearning, courses }) {
  const inProgress = enrolled.filter((e) => e.status === "in-progress");
  const complete = enrolled.filter((e) => e.status === "complete");

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const goalDays = [true, true, false, true, true, false, false];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div className="ks-card" style={{ padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Good morning, {LEARNER.name.split(" ")[0]}</div>
          <div style={{ fontSize: 13, color: "var(--slate)", marginTop: 2 }}>Your goal: <b style={{ color: "var(--ink)" }}>{LEARNER.goal}</b></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold-tint)", padding: "8px 14px", borderRadius: 100 }}>
          <Flame size={16} color="var(--gold-dark)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-dark)" }}>{LEARNER.streak}-day streak</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
            {[
              { label: "In progress", value: inProgress.length, icon: PlayCircle, tint: "var(--gold-tint)", fg: "var(--gold-dark)" },
              { label: "Completed", value: complete.length, icon: CheckCircle2, tint: "var(--success-tint)", fg: "var(--success)" },
              { label: "Certificates", value: complete.length, icon: Award, tint: "var(--coral-tint)", fg: "var(--coral)" },
            ].map((s) => (
              <div key={s.label} className="ks-card" style={{ flex: 1, padding: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: s.tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <s.icon size={15} color={s.fg} />
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: "var(--slate-light)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 12 }}>Continue learning</div>
          {inProgress.map((e) => {
            const c = courses.find((x) => x.id === e.courseId);
            if (!c) return null;
            return (
              <div key={e.courseId} className="ks-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                <KeystoneArch progress={e.progress} size={48} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>
                    {Math.round(e.progress * c.modules)} of {c.modules} modules · last opened {e.lastAccessed}
                  </div>
                  <div style={{ height: 5, background: "var(--line)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${e.progress * 100}%`, background: "var(--gold)" }} />
                  </div>
                </div>
                <button className="ks-btn ks-btn-primary" onClick={() => onStartLearning(c)}>Resume</button>
              </div>
            );
          })}

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", margin: "24px 0 12px" }}>Completed</div>
          {complete.map((e) => {
            const c = courses.find((x) => x.id === e.courseId);
            return (
              <div key={e.courseId} className="ks-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={22} color="var(--success)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>Completed {e.lastAccessed} · certificate issued</div>
                </div>
                <button className="ks-btn ks-btn-ghost">View certificate</button>
              </div>
            );
          })}
        </div>

        <div>
          <div className="ks-card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>July 2026</span>
              <div style={{ display: "flex", gap: 6 }}>
                <ChevronLeft size={14} color="var(--slate-light)" />
                <ChevronRight size={14} color="var(--slate-light)" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
              {days.map((d, i) => <div key={i} style={{ fontSize: 11, color: "var(--slate-light)" }}>{d}</div>)}
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{
                  fontSize: 12, padding: "5px 0", borderRadius: 6,
                  background: i === 8 ? "var(--gold)" : goalDays[i % 7] ? "var(--gold-tint)" : "transparent",
                  color: i === 8 ? "#2B1E06" : "var(--ink)", fontWeight: i === 8 ? 700 : 400,
                }}>{i + 1}</div>
              ))}
            </div>
            <hr className="ks-hairline" style={{ margin: "16px 0" }} />
            <div style={{ fontSize: 12.5, color: "var(--slate)" }}>Daily goal · {LEARNER.dailyGoalMin} min</div>
            <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>{LEARNER.goalHitDays} of 7 days hit this week</div>
          </div>

          <div className="ks-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>This week</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 500 }}>{LEARNER.minutesThisWeek}<span style={{ fontSize: 13, color: "var(--slate-light)" }}> min</span></div>
            <div style={{ fontSize: 12, color: "var(--slate-light)" }}>learned across {inProgress.length + complete.length} courses</div>
          </div>
        </div>
      </div>
    </div>
  );
}