import { useEffect, useState } from "react";
import { CheckCircle2, X, ArrowRight, Milestone } from "lucide-react";

/* ---------- Learning path detail modal ---------- */

// #224 — same "never actually unmounts, closing is just `path` going
// null" convention as CourseDetailModal (see that file's comment for the
// full reasoning behind visiblePath/closing).
export function LearningPathDetailModal({ path, onClose, onEnrol, onGoToDashboard, isEnrolled, enrolling, onOpenCourse }) {
  const [visiblePath, setVisiblePath] = useState(path);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (path) {
      setVisiblePath(path);
      setClosing(false);
      return;
    }
    if (visiblePath) {
      setClosing(true);
      const timer = setTimeout(() => setVisiblePath(null), 160);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  if (!visiblePath) return null;
  return (
    <div onClick={onClose} className={`ks-modal-backdrop ${closing ? "ks-modal-closing" : ""}`} style={{ position: "fixed", inset: 0, background: "#16233Db3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className={`ks-card ks-modal-card ${closing ? "ks-modal-closing" : ""}`} style={{ width: "100%", maxWidth: 560, maxHeight: "86vh", overflowY: "auto", padding: 0 }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Milestone size={14} color="var(--gold-dark)" />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Learning path · {visiblePath.courses.length} courses</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, margin: 0 }}>{visiblePath.title}</h2>
          </div>
          <X size={20} color="var(--slate)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={onClose} />
        </div>

        <div style={{ padding: "20px 28px" }}>
          {visiblePath.description && (
            <p style={{ fontSize: 14.5, color: "var(--ink-70)", lineHeight: 1.6, marginBottom: 22 }}>{visiblePath.description}</p>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 10 }}>Courses, in order</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 6 }}>
            {visiblePath.courses.map((c, i) => (
              <div
                key={c.id}
                onClick={onOpenCourse ? () => onOpenCourse(c) : undefined}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < visiblePath.courses.length - 1 ? "1px solid var(--line)" : "none", cursor: onOpenCourse ? "pointer" : "default" }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--slate-light)", width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "var(--slate-light)" }}>{c.provider} · {c.hours}h</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky footer, same convention as CourseDetailModal (#75). */}
        <div style={{ position: "sticky", bottom: 0, background: "var(--paper-2)", borderTop: "1px solid var(--line)", padding: "16px 28px" }}>
          <button className="ks-btn ks-btn-gold"
            style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15, opacity: enrolling ? 0.6 : 1, cursor: enrolling ? "default" : "pointer" }}
            disabled={enrolling}
            onClick={() => (isEnrolled ? onGoToDashboard() : onEnrol(visiblePath))}>
            {enrolling
              ? <>Enrolling…</>
              : isEnrolled
              ? <><CheckCircle2 size={16} /> Already enrolled — go to My learning</>
              : <>Enrol in path <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
