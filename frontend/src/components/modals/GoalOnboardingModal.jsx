import { useEffect, useState } from "react";
import { Code2, Briefcase, Compass, X } from "lucide-react";

const OPTIONS = [
  { value: "Technical", label: "Technical", blurb: "Programming, data, and engineering skills.", icon: Code2 },
  { value: "Business", label: "Business", blurb: "Strategy, analytics, and operations.", icon: Briefcase },
  { value: "Leadership", label: "Leadership", blurb: "Managing people and leading teams.", icon: Compass },
];

// #107 — shown once, right after a learner signs up (see App.jsx's
// handleAuthSubmit; never shown for logins or trainer accounts). Never
// blocks: skipping just leaves profiles.goal null, same state as an
// existing account that predates this feature — Dashboard and the sidebar
// already treat a missing goal as "don't show it" rather than requiring one.
// Same "always mounted, closing animates before actually disappearing"
// shape as AuthModal/CourseDetailModal (#105), keyed on `open` here since
// there's no external content (like a course) to preserve through the close.
export function GoalOnboardingModal({ open, onSelect, onSkip }) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      setSubmitting(false);
      return;
    }
    if (visible) {
      setClosing(true);
      const timer = setTimeout(() => setVisible(false), 160);
      return () => clearTimeout(timer);
    }
    // Deliberately scoped to `open` only; see comment above the
    // component for why `visible` must stay out of this array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!visible) return null;

  async function handleSelect(value) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSelect(value);
      // On success the parent flips `open` to false, which the effect
      // above picks up to play the close animation. Nothing else to do here.
    } catch (err) {
      console.error("Failed to save goal:", err.message);
      setSubmitting(false); // let them retry rather than getting stuck
    }
  }

  return (
    <div className={`ks-modal-backdrop ${closing ? "ks-modal-closing" : ""}`} style={{ position: "fixed", inset: 0, background: "#16233Db3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div className={`ks-card ks-modal-card ${closing ? "ks-modal-closing" : ""}`} style={{ width: "100%", maxWidth: 440, padding: "28px 28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20 }}>What brings you here?</div>
          <X size={18} color="var(--slate)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={onSkip} />
        </div>
        <div style={{ fontSize: 13.5, color: "var(--slate)", marginBottom: 20 }}>
          Pick a focus area — it shows up on your dashboard and helps point you at relevant courses.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 10,
                  border: "1px solid var(--line)", background: "var(--paper)",
                  cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--gold-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} color="var(--gold-dark)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)" }}>{opt.blurb}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          onClick={submitting ? undefined : onSkip}
          style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", marginTop: 18, cursor: submitting ? "default" : "pointer" }}
        >
          Skip for now
        </div>
      </div>
    </div>
  );
}
