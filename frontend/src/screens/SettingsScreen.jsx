import { useState } from "react";
import { User, Lock, Eye, EyeOff, Trophy } from "lucide-react";

import { PageHeader } from "../components/common/Primitives";
import { getDisplayName } from "../lib/userDisplay";

// #296 — the original 150/300/450/600/900 presets (and the 300 default
// below) were calibrated on the old flat per-action point values
// (view/quiz/note/post, all 30-50 pts). They never accounted for
// module-completion points, which scale with course.hours and average
// ~1,350-1,578 pts per module across the real course catalog — so
// finishing a single module cleared every preset, including the top one,
// on 38 of 40 courses. Rescaled around that real average: well below it,
// up through roughly it, topping out just under 2x it.
const DAILY_GOAL_PRESETS = [500, 1000, 1500, 2200, 3000];

/* ---------- Screen: Account settings ---------- */

// #255 — a dedicated settings screen. Three cards: Profile (name, which
// used to have no edit path at all), Password (previously only reachable
// via the forgot-password email flow), and Preferences (daily goal +
// leaderboard opt-in, moved here from DashboardScreen's sidebar rather
// than duplicated — see DashboardScreen's own #255 comment).
export function SettingsScreen({
  user,
  onUpdateName,
  onChangePassword,
  activitySummary = { dailyGoalPoints: 1500 }, // #296 — matches the new signup default
  onUpdateDailyGoal,
  leaderboardOptIn = false,
  onUpdateLeaderboardOptIn,
  onOpenLeaderboard,
}) {
  // --- Profile name ---
  // #255 — prefilled from getDisplayName(user) (Supabase auth metadata),
  // the same value shown everywhere else a user sees their own name
  // (greeting, sidebar) — not a separate fetch of profile.name, which can
  // only ever be reached via a round trip and would just show the same
  // thing in the common case anyway (see updateName's own comment for why
  // saving writes both).
  const [name, setName] = useState(getDisplayName(user));
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [nameSaved, setNameSaved] = useState(false);

  async function handleSaveName(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || savingName) return;
    setSavingName(true);
    setNameError(null);
    setNameSaved(false);
    try {
      await onUpdateName(trimmed);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2400);
    } catch (err) {
      setNameError(err.message || "Failed to update name.");
    } finally {
      setSavingName(false);
    }
  }

  // --- Password ---
  // #255 — same 8-char-minimum + confirm-match validation as
  // ResetPasswordModal (the forgot-password flow's equivalent form).
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSaved, setPwSaved] = useState(false);

  const pwValid = password.length >= 8;
  const pwMatches = password === confirm;
  const canSubmitPw = pwValid && pwMatches;

  async function handleSavePassword(e) {
    e.preventDefault();
    setPwTouched(true);
    setPwError(null);
    if (!canSubmitPw || savingPw) return;
    setSavingPw(true);
    try {
      await onChangePassword(password);
      setPassword("");
      setConfirm("");
      setPwTouched(false);
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2400);
    } catch (err) {
      setPwError(err.message || "Failed to update password.");
    } finally {
      setSavingPw(false);
    }
  }

  // --- Preferences: daily goal + leaderboard opt-in ---
  // #255 — moved verbatim from DashboardScreen (#188/#231), same
  // handler shape, just living here instead.
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingLeaderboardOptIn, setSavingLeaderboardOptIn] = useState(false);

  async function handlePickDailyGoal(points) {
    if (savingGoal || points === activitySummary.dailyGoalPoints) return;
    setSavingGoal(true);
    try {
      await onUpdateDailyGoal(points);
    } catch (err) {
      console.error("Failed to update daily goal:", err.message);
    } finally {
      setSavingGoal(false);
    }
  }

  async function handleToggleLeaderboardOptIn() {
    if (savingLeaderboardOptIn) return;
    setSavingLeaderboardOptIn(true);
    try {
      await onUpdateLeaderboardOptIn(!leaderboardOptIn);
    } catch (err) {
      console.error("Failed to update leaderboard opt-in:", err.message);
    } finally {
      setSavingLeaderboardOptIn(false);
    }
  }

  const field = { marginBottom: 16 };
  const label = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 };
  const inputWrap = { position: "relative" };
  const errorText = { fontSize: 12, color: "var(--coral)", marginTop: 6 };
  const savedText = { fontSize: 12, color: "var(--success)", marginTop: 6 };

  return (
    // #336 — shared .ks-page-scaled primitive instead of a hardcoded
    // maxWidth, so this form grows (modestly, from its own 640 base) at
    // the same large breakpoint as the rest of the app.
    <div className="ks-page-enter ks-page-scaled" style={{ padding: "28px 32px", "--ks-page-base": "640px" }}>
      <PageHeader title="Account settings" />

      <div className="ks-card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Profile</div>
        <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginBottom: 16 }}>
          Your name appears on your own greeting, plus any forum posts or course reviews you leave.
        </div>
        <form onSubmit={handleSaveName}>
          <div style={field}>
            <label style={label} htmlFor="ks-settings-name">Name</label>
            <div style={inputWrap}>
              <User size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 12 }} />
              <input
                id="ks-settings-name"
                type="text"
                className="ks-input"
                style={{ paddingLeft: 38 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
            </div>
            {nameError && <div style={errorText}>{nameError}</div>}
            {nameSaved && <div style={savedText}>Saved.</div>}
          </div>
          <button type="submit" className="ks-btn ks-btn-gold" disabled={savingName || !name.trim()} style={{ opacity: savingName ? 0.7 : 1 }}>
            {savingName ? "Saving…" : "Save name"}
          </button>
        </form>
      </div>

      <div className="ks-card" style={{ padding: "20px 22px", marginBottom: 20 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Password</div>
        <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginBottom: 16 }}>
          Choose a new password for your account.
        </div>
        <form onSubmit={handleSavePassword}>
          <div style={field}>
            <label style={label} htmlFor="ks-settings-pw">New password</label>
            <div style={inputWrap}>
              <Lock size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 12 }} />
              <input
                id="ks-settings-pw"
                type={showPw ? "text" : "password"}
                className="ks-input"
                style={{ paddingLeft: 38, paddingRight: 40 }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {showPw
                ? <EyeOff size={15} color="var(--slate-light)" style={{ position: "absolute", right: 13, top: 12, cursor: "pointer" }} onClick={() => setShowPw(false)} />
                : <Eye size={15} color="var(--slate-light)" style={{ position: "absolute", right: 13, top: 12, cursor: "pointer" }} onClick={() => setShowPw(true)} />}
            </div>
            {pwTouched && !pwValid && <div style={errorText}>Password must be at least 8 characters.</div>}
          </div>
          <div style={field}>
            <label style={label} htmlFor="ks-settings-pw-confirm">Confirm password</label>
            <div style={inputWrap}>
              <Lock size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 12 }} />
              <input
                id="ks-settings-pw-confirm"
                type={showPw ? "text" : "password"}
                className="ks-input"
                style={{ paddingLeft: 38 }}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {pwTouched && pwValid && !pwMatches && <div style={errorText}>Passwords don't match.</div>}
          </div>
          {pwError && <div style={errorText}>{pwError}</div>}
          {pwSaved && <div style={savedText}>Password updated.</div>}
          <button type="submit" className="ks-btn ks-btn-gold" disabled={savingPw} style={{ opacity: savingPw ? 0.7 : 1 }}>
            {savingPw ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>

      <div className="ks-card" style={{ padding: "20px 22px" }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>Preferences</div>

        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate)", marginBottom: 8 }}>Daily goal</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DAILY_GOAL_PRESETS.map((m) => (
            <span
              key={m}
              onClick={() => handlePickDailyGoal(m)}
              style={{
                fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 100,
                cursor: savingGoal ? "default" : "pointer", opacity: savingGoal ? 0.6 : 1,
                background: m === activitySummary.dailyGoalPoints ? "var(--ink)" : "var(--paper-2)",
                color: m === activitySummary.dailyGoalPoints ? "var(--paper)" : "var(--slate)",
                border: "1px solid var(--line)",
              }}
            >
              {m} pts
            </span>
          ))}
        </div>

        <hr className="ks-hairline" style={{ margin: "18px 0" }} />

        {/* #258 — was two separate divs (label + switch) each with their own
            onClick calling the same handler; neither had a role, checked
            state, or accessible name. Merged into a single real button with
            role="switch"/aria-checked so it's keyboard-operable and
            announces its on/off state, instead of adding aria-label to an
            unreachable div. */}
        <button
          type="button"
          role="switch"
          aria-checked={leaderboardOptIn}
          aria-label="Show me on the leaderboard"
          disabled={savingLeaderboardOptIn}
          onClick={handleToggleLeaderboardOptIn}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%",
            background: "none", border: "none", padding: 0, cursor: savingLeaderboardOptIn ? "default" : "pointer",
            opacity: savingLeaderboardOptIn ? 0.6 : 1, font: "inherit",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink)" }}>
            <Trophy size={14} color="var(--gold-dark)" />
            Show me on the leaderboard
          </span>
          <span
            style={{
              width: 32, height: 18, borderRadius: 100, padding: 2,
              background: leaderboardOptIn ? "var(--gold)" : "var(--line)",
              display: "flex", justifyContent: leaderboardOptIn ? "flex-end" : "flex-start", flexShrink: 0,
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: 99, background: "#fff", display: "block" }} />
          </span>
        </button>
        {leaderboardOptIn && onOpenLeaderboard && (
          <div onClick={onOpenLeaderboard} style={{ fontSize: 12, color: "var(--gold-dark)", fontWeight: 600, marginTop: 10, cursor: "pointer" }}>
            View leaderboard →
          </div>
        )}
      </div>
    </div>
  );
}
