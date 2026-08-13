import { useEffect, useState } from "react";
import { CheckCircle2, Clock, X, ArrowRight, BookMarked } from "lucide-react";

import { Stars, CategoryDot } from "../../components/common/Primitives";


/* ---------- Course detail modal ---------- */

// #105 — this component never actually unmounts (App.jsx always renders
// <CourseDetailModal course={selectedCourse} .../>); it just returns null
// when `course` is falsy. That means every close — the X, the backdrop
// click, "go to dashboard", or a successful enrol — is just `course`
// going null, regardless of which one triggered it. So rather than
// hooking every individual close handler, a single effect watches for
// that null transition and keeps rendering the last known course for one
// more animation frame (via `visibleCourse`) while a `closing` class
// plays the fade/scale-out, then actually drops the content.
export function CourseDetailModal({ course, onClose, onEnrol, onGoToDashboard, isEnrolled, enrolling }) {
  const [visibleCourse, setVisibleCourse] = useState(course);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (course) {
      setVisibleCourse(course);
      setClosing(false);
      return;
    }
    if (visibleCourse) {
      setClosing(true);
      const timer = setTimeout(() => setVisibleCourse(null), 160);
      return () => clearTimeout(timer);
    }
    // Deliberately scoped to `course` only; see comment above the
    // component for why `visibleCourse` must stay out of this array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  if (!visibleCourse) return null;
  return (
    <div onClick={onClose} className={`ks-modal-backdrop ${closing ? "ks-modal-closing" : ""}`} style={{ position: "fixed", inset: 0, background: "#16233Db3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className={`ks-card ks-modal-card ${closing ? "ks-modal-closing" : ""}`} style={{ width: "100%", maxWidth: 620, maxHeight: "86vh", overflowY: "auto", padding: 0 }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <CategoryDot color={visibleCourse.color} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{visibleCourse.category} · {visibleCourse.level}</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, margin: 0 }}>{visibleCourse.title}</h2>
            <div style={{ fontSize: 13, color: "var(--slate-light)", marginTop: 4 }}>{visibleCourse.provider}</div>
          </div>
          <X size={20} color="var(--slate)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={onClose} />
        </div>

        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", gap: 22, marginBottom: 18, fontSize: 13, color: "var(--slate)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={14} /> {visibleCourse.hours} hours</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Stars rating={visibleCourse.rating} /> {visibleCourse.rating} ({visibleCourse.learners.toLocaleString()})</span>
          </div>
          <p style={{ fontSize: 14.5, color: "var(--ink-70)", lineHeight: 1.6, marginBottom: 22 }}>{visibleCourse.blurb}</p>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 10 }}>Course agenda</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 22 }}>
            {visibleCourse.modules.map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < visibleCourse.modules.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--slate-light)", width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 14 }}>{m.title}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 10 }}>FAQ</div>
          <div style={{ marginBottom: 22 }}>
            {/* course.faqs comes from the DB (course_faqs table) — every seeded
                course has at least the placeholder pair from #8, so the fallback
                below mainly protects against a future course created with none. */}
            {(visibleCourse.faqs && visibleCourse.faqs.length > 0
              ? visibleCourse.faqs
              : [
                  { question: "Do I get a certificate?", answer: "Yes — issued automatically once all modules and the final project are complete." },
                  { question: "Can I go at my own pace?", answer: "Yes, all modules stay open for the life of your account." },
                ]
            ).map((item, i) => (
              <div key={item.id ?? i}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{item.question}</div>
                <div style={{ fontSize: 13.5, color: "var(--slate)", marginBottom: 12 }}>{item.answer}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <BookMarked size={13} color="var(--slate-light)" />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)" }}>Sources & credits</span>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {visibleCourse.credits.map((c, i) => (
              <li key={c.id} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--slate)", lineHeight: 1.55, padding: "5px 0", borderBottom: i < visibleCourse.credits.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ color: "var(--gold-dark)", flexShrink: 0 }}>·</span>
                <span>{c.line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sticky footer: a sibling of the scrollable content div above,
            both inside the same overflowY:auto card — sticky positions
            relative to that scroll container, so this pins to the bottom
            of the visible modal regardless of how long the agenda/FAQ/
            credits content above it is (#75). Own background + top
            border so scrolled content doesn't show through underneath it. */}
        <div style={{ position: "sticky", bottom: 0, background: "var(--paper-2)", borderTop: "1px solid var(--line)", padding: "16px 28px" }}>
          <button className="ks-btn ks-btn-gold"
            style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15, opacity: enrolling ? 0.6 : 1, cursor: enrolling ? "default" : "pointer" }}
            disabled={enrolling}
            onClick={() => (isEnrolled ? onGoToDashboard() : onEnrol(visibleCourse))}>
            {enrolling
              ? <>Enrolling…</>
              : isEnrolled
              ? <><CheckCircle2 size={16} /> Already enrolled — go to My learning</>
              : <>Enrol now <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}