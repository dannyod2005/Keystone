import { useState } from "react";
import { PlayCircle, CheckCircle2, Award, ChevronLeft, ChevronRight, Flame, Pencil } from "lucide-react";

import { KeystoneArch, PageHeader } from "../components/common/Primitives";
import { getDisplayName, getFirstName } from "../lib/userDisplay";
/* ---------- Screen: Dashboard ---------- */

const DEFAULT_ACTIVITY_SUMMARY = { streak: 0, minutesThisWeek: 0, dailyGoalMin: 30, goalHitDays: 0, week: [] };

// #188 — presets rather than a free-text/number input: the dashboard card
// is a tight space, and a handful of realistic options (matching
// UpdateDailyGoalDto's 5–240 min bounds on the backend) covers the
// realistic range without needing input validation UI here too.
const DAILY_GOAL_PRESETS = [15, 30, 45, 60, 90];

export function DashboardScreen({ enrolled, onOpenCourse, onStartLearning, courses, onViewCertificate, user, goal = null, activitySummary = DEFAULT_ACTIVITY_SUMMARY, loading = false, calendarWeekOffset = 0, onPrevWeek, onNextWeek, onUpdateDailyGoal }) {
  const firstName = getFirstName(getDisplayName(user));
  // #188 — the DB column already existed; this is the first real UI for
  // it. Inline on the dashboard card rather than a separate settings
  // screen (there isn't one yet) or folded into the #107 goal-onboarding
  // modal (that's a one-tap "pick a track" flow — adding a second,
  // differently-shaped question to it would complicate a flow that's
  // deliberately kept to a single click today).
  const [editingGoal, setEditingGoal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  async function handlePickDailyGoal(minutes) {
    if (savingGoal || minutes === activitySummary.dailyGoalMin) {
      setEditingGoal(false);
      return;
    }
    setSavingGoal(true);
    try {
      await onUpdateDailyGoal(minutes);
      setEditingGoal(false);
    } catch (err) {
      console.error("Failed to update daily goal:", err.message);
    } finally {
      setSavingGoal(false);
    }
  }
  const inProgress = enrolled.filter((e) => e.status === "in-progress");
  const complete = enrolled.filter((e) => e.status === "complete");
  // #86 — "in-progress" (not yet complete) splits into two display groups:
  // genuinely started (progress > 0) vs. enrolled but never opened
  // (progress === 0, no lastAccessed yet — the two are set together in
  // the same backend call, so either is an equivalent signal). Kept as a
  // separate split from `inProgress` above rather than redefining it, so
  // non-complete enrollment, same as before — only the list rendering
  // distinguishes the two.
  const enrolledCourseCount = inProgress.length + complete.length;
  const notStarted = inProgress.filter((e) => e.progress === 0);
  const continuing = inProgress.filter((e) => e.progress > 0);

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthLabel = activitySummary.week[0]
    ? new Date(`${activitySummary.week[0].date}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  async function handleViewCertificate(enrollmentId) {
    try {
      await onViewCertificate(enrollmentId);
    } catch (err) {
      console.error("Failed to load certificate:", err.message);
    }
  }

  // #204/#213 — Catalogue/Discover center their content (maxWidth +
  // margin: "0 auto"); this only ever had the maxWidth half, so on a wide
  // viewport it hugged the left edge instead of centering like the rest
  // of the app (#204). maxWidth was later raised from 1080 to 1160 to
  // match Catalogue/Discover exactly (#213) — the 2fr/1fr stats+calendar
  // layout below just gets a little more breathing room at that width,
  // nothing structural needed changing.
  return (
    <div className="ks-page-enter" style={{ padding: "28px 32px", maxWidth: 1160, margin: "0 auto" }}>
      {/* #213 — Dashboard had no page-level title at all (its largest
          text was this card's 15px greeting line), unlike Catalogue's
          30px h1 — PageHeader closes that gap with the same shared scale.
          No subtitle: the greeting card right below already carries
          personalized context (name, goal, streak), so a second
          "welcome" line here would just be repetitive. */}
      <PageHeader title="My learning" />
      <div className="ks-card" style={{ padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Good morning, {firstName}</div>
          {/* #107 — goal is null until a learner picks one via the
              onboarding modal (or if they skipped it); hidden entirely
              rather than showing an empty/placeholder line. */}
          {goal && (
            <div style={{ fontSize: 13, color: "var(--slate)", marginTop: 2 }}>Your goal: <b style={{ color: "var(--ink)" }}>{goal}</b></div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold-tint)", padding: "8px 14px", borderRadius: 100 }}>
          <Flame size={16} color="var(--gold-dark)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-dark)" }}>{activitySummary.streak}-day streak</span>
        </div>
      </div>

      {/* #104 — single column on mobile, 2fr/1fr from md up; column layout
          is the only breakpoint-dependent property here. */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr]" style={{ gap: 20 }}>
        <div>
          {loading ? (
            <div className="ks-card" style={{ padding: 40, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
              Loading your learning…
            </div>
          ) : (
          <>
          <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
            {[
              { label: "In progress", value: inProgress.length, icon: PlayCircle, tint: "var(--gold-tint)", fg: "var(--gold-dark)" },
              { label: "Completed", value: complete.length, icon: CheckCircle2, tint: "var(--success-tint)", fg: "var(--success)" },
              { label: "Certificates", value: complete.length, icon: Award, tint: "var(--coral-tint)", fg: "var(--coral)" },
            ].map((s) => (
              <div key={s.label} className="ks-card" style={{ flex: 1, minWidth: 140, padding: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: s.tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <s.icon size={15} color={s.fg} />
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: "var(--slate-light)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {notStarted.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 12 }}>Not started</div>
              {notStarted.map((e) => {
                const c = courses.find((x) => x.id === e.courseId);
                if (!c) return null;
                return (
                  <div key={e.courseId} className="ks-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                    <KeystoneArch progress={0} size={48} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>
                        {c.modules.length} module{c.modules.length === 1 ? "" : "s"} · not started yet
                      </div>
                    </div>
                    <button className="ks-btn ks-btn-primary" onClick={() => onStartLearning(c)}>Start</button>
                  </div>
                );
              })}
            </>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", margin: notStarted.length > 0 ? "24px 0 12px" : "0 0 12px" }}>Continue learning</div>
          {continuing.length === 0 ? (
            <div className="ks-card" style={{ padding: 16, marginBottom: 12, fontSize: 13, color: "var(--slate-light)" }}>
              Nothing in progress yet.
            </div>
          ) : (
            continuing.map((e) => {
              const c = courses.find((x) => x.id === e.courseId);
              if (!c) return null;
              return (
                <div key={e.courseId} className="ks-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                  <KeystoneArch progress={e.progress} size={48} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>
                      {Math.round(e.progress * c.modules.length)} of {c.modules.length} modules · last opened {e.lastAccessed}
                    </div>
                    <div style={{ height: 5, background: "var(--line)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${e.progress * 100}%`, background: "var(--gold)" }} />
                    </div>
                  </div>
                  <button className="ks-btn ks-btn-primary" onClick={() => onStartLearning(c)}>Resume</button>
                </div>
              );
            })
          )}

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", margin: "24px 0 12px" }}>Completed</div>
          {complete.map((e) => {
            const c = courses.find((x) => x.id === e.courseId);
            if (!c) return null;
            return (
              <div key={e.courseId} className="ks-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={22} color="var(--success)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>Completed {e.lastAccessed} · certificate issued</div>
                </div>
                <button className="ks-btn ks-btn-ghost" onClick={() => handleViewCertificate(e.id)}>View certificate</button>
              </div>
            );
          })}
          </>
          )}
        </div>

        <div>
          <div className="ks-card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{monthLabel}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {/* #183 — pages the day grid to an adjacent 7-day week;
                    "next" stops at the real current week — there's
                    nothing to look ahead to yet. */}
                <ChevronLeft
                  size={14}
                  color="var(--slate-light)"
                  style={{ cursor: "pointer" }}
                  onClick={onPrevWeek}
                />
                <ChevronRight
                  size={14}
                  color={calendarWeekOffset >= 0 ? "var(--line)" : "var(--slate-light)"}
                  style={{ cursor: calendarWeekOffset >= 0 ? "not-allowed" : "pointer" }}
                  onClick={calendarWeekOffset >= 0 ? undefined : onNextWeek}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
              {days.map((d, i) => <div key={i} style={{ fontSize: 11, color: "var(--slate-light)" }}>{d}</div>)}
              {activitySummary.week.map((day) => {
                const isToday = day.date === todayKey;
                return (
                  <div key={day.date} style={{
                    fontSize: 12, padding: "5px 0", borderRadius: 6,
                    background: isToday ? "var(--gold)" : day.goalHit ? "var(--gold-tint)" : "transparent",
                    color: isToday ? "#2B1E06" : "var(--ink)", fontWeight: isToday ? 700 : 400,
                  }}>{new Date(`${day.date}T00:00:00Z`).getUTCDate()}</div>
                );
              })}
            </div>
            <hr className="ks-hairline" style={{ margin: "16px 0" }} />
            {editingGoal ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAILY_GOAL_PRESETS.map((m) => (
                  <span
                    key={m}
                    onClick={() => handlePickDailyGoal(m)}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 100,
                      cursor: savingGoal ? "default" : "pointer", opacity: savingGoal ? 0.6 : 1,
                      background: m === activitySummary.dailyGoalMin ? "var(--ink)" : "var(--paper-2)",
                      color: m === activitySummary.dailyGoalMin ? "var(--paper)" : "var(--slate)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <div
                onClick={() => setEditingGoal(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--slate)", cursor: "pointer" }}
              >
                Daily goal · {activitySummary.dailyGoalMin} min
                <Pencil size={11} color="var(--slate-light)" />
              </div>
            )}
            <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>{activitySummary.goalHitDays} of 7 days hit this week</div>
          </div>

          <div className="ks-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>This week</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 500 }}>{activitySummary.minutesThisWeek}<span style={{ fontSize: 13, color: "var(--slate-light)" }}> min</span></div>
            <div style={{ fontSize: 12, color: "var(--slate-light)" }}>learning time logged</div>
            <hr className="ks-hairline" style={{ margin: "16px 0" }} />
            <div style={{ fontSize: 12.5, color: "var(--slate)" }}>Enrolled in {enrolledCourseCount} course{enrolledCourseCount === 1 ? "" : "s"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}