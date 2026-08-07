import { CheckCircle2, Clock, X, ArrowRight, BookMarked } from "lucide-react";

import { Stars, CategoryDot } from "../../components/common/Primitives";


/* ---------- Course detail modal ---------- */

export function CourseDetailModal({ course, onClose, onEnrol, onGoToDashboard, isEnrolled }) {
  if (!course) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#16233Db3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="ks-card" style={{ width: "100%", maxWidth: 620, maxHeight: "86vh", overflowY: "auto", padding: 0 }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <CategoryDot color={course.color} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{course.category} · {course.level}</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, margin: 0 }}>{course.title}</h2>
            <div style={{ fontSize: 13, color: "var(--slate-light)", marginTop: 4 }}>{course.provider}</div>
          </div>
          <X size={20} color="var(--slate)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={onClose} />
        </div>

        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", gap: 22, marginBottom: 18, fontSize: 13, color: "var(--slate)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={14} /> {course.hours} hours</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Stars rating={course.rating} /> {course.rating} ({course.learners.toLocaleString()})</span>
          </div>
          <p style={{ fontSize: 14.5, color: "var(--ink-70)", lineHeight: 1.6, marginBottom: 22 }}>{course.blurb}</p>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 10 }}>Course agenda</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 22 }}>
            {course.modules.map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < course.modules.length - 1 ? "1px solid var(--line)" : "none" }}>
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
            {(course.faqs && course.faqs.length > 0
              ? course.faqs
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
          <ul style={{ margin: "0 0 22px", padding: 0, listStyle: "none" }}>
            {course.credits.map((c, i) => (
              <li key={c.id} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--slate)", lineHeight: 1.55, padding: "5px 0", borderBottom: i < course.credits.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ color: "var(--gold-dark)", flexShrink: 0 }}>·</span>
                <span>{c.line}</span>
              </li>
            ))}
          </ul>

          <button className="ks-btn ks-btn-gold" style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15 }}
            onClick={() => (isEnrolled ? onGoToDashboard() : onEnrol(course))}>
            {isEnrolled ? <><CheckCircle2 size={16} /> Already enrolled — go to My learning</> : <>Enrol now <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}