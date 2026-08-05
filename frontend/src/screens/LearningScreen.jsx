import { useState } from "react";
import { PlayCircle, CheckCircle2, ChevronLeft} from "lucide-react";


export function LearningScreen({ course, enrollment, onSaveProgress, onBack }) {
  const [tab, setTab] = useState("video");

  const modules = course.modules ?? [];

  // Hydrate from real saved progress instead of always starting at 0.
  // enrollment.progress is a fraction (0-1); convert back to a module
  // count, clamped to a valid index range.
  const initialActiveModule = enrollment
    ? Math.min(Math.round(enrollment.progress * modules.length), modules.length)
    : 0;

  const [activeModule, setActiveModule] = useState(initialActiveModule);
  const [saving, setSaving] = useState(false);

  if (!course) return null;

  const hasModules = modules.length > 0;
  const isComplete = activeModule >= modules.length;
  const currentModule = modules[activeModule];
  const isLastModule = activeModule >= modules.length - 1;

  async function handleMarkComplete() {
    const nextActiveModule = isLastModule ? modules.length : activeModule + 1;
    setActiveModule(nextActiveModule);

    if (!enrollment || !onSaveProgress) return; // no enrollment context — nothing to persist

    setSaving(true);
    try {
      await onSaveProgress(enrollment.id, nextActiveModule);
    } catch (err) {
      console.error("Failed to save progress:", err.message);
      // Not reverting activeModule on failure — the learner's local
      // progress through the video/tabs stays usable even if the save
      // failed; it'll just be retried next time they mark a module
      // complete, or the discrepancy is visible next time the dashboard
      // is checked. A toast here would need lifting state up to App.jsx;
      // left as a possible follow-up rather than adding that now.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "22px 32px 40px", maxWidth: 1080 }}>
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--slate)", cursor: "pointer", marginBottom: 14 }}>
        <ChevronLeft size={15} /> Back to My learning
      </div>

      {!hasModules ? (
        <div className="ks-card" style={{ padding: 24, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
          This course doesn't have any modules yet. Check back once the trainer has added content.
        </div>
      ) : isComplete ? (
        <div className="ks-card" style={{ padding: 24, textAlign: "center" }}>
          <CheckCircle2 size={32} color="var(--success)" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Course complete</div>
          <div style={{ fontSize: 13.5, color: "var(--slate-light)" }}>You've finished all {modules.length} modules.</div>
        </div>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 22 }}>
        <div>
          <div className="ks-card" style={{ padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Module {activeModule + 1} of {modules.length}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{currentModule.title}</div>
          </div>

          {currentModule.videoUrl ? (
            <div style={{ background: "var(--ink)", borderRadius: 14, aspectRatio: "16/9", overflow: "hidden", marginBottom: 4 }}>
              <iframe
                key={currentModule.videoUrl}
                src={currentModule.videoUrl}
                title={currentModule.title}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{ background: "var(--ink)", borderRadius: 14, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              <PlayCircle size={52} color="var(--gold)" />
            </div>
          )}
          <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginBottom: 18 }}>
            {currentModule.videoUrl ? currentModule.title : `12:40 · ${currentModule.title}`}
          </div>

          <div style={{ display: "flex", gap: 20, borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
            {["video", "notes", "quiz", "forum"].map((t) => (
              <div key={t} className={`ks-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</div>
            ))}
          </div>

          {tab === "video" && (
            <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.6 }}>
              This module covers {currentModule.title.toLowerCase()}. Follow along in the video, then apply it in the short exercise before moving to the quiz.
            </p>
          )}
          {tab === "notes" && (
            <div className="ks-card" style={{ padding: 16 }}>
              <textarea placeholder="Jot down notes for this module — only visible to you." style={{ width: "100%", minHeight: 120, border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 13.5, resize: "vertical", background: "transparent" }} />
            </div>
          )}
          {tab === "quiz" && (
            <div className="ks-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Quick check — 3 questions</div>
              {["Which step happens first when calling a tool?", "What reduces hallucinated tool calls?", "Where should retrieved context be placed?"].map((q, i) => (
                <div key={q} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 8 }}>{i + 1}. {q}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["A", "B", "C"].map((o) => (
                      <span key={o} style={{ fontSize: 12.5, border: "1px solid var(--line)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>Option {o}</span>
                    ))}
                  </div>
                </div>
              ))}
              <button className="ks-btn ks-btn-gold">Submit answers</button>
            </div>
          )}
          {tab === "forum" && (
            <div className="ks-card" style={{ padding: 16 }}>
              {[["Sam K.", "Anyone else find the tool-use section moves fast? Rewatched twice, worth it."], ["Dana P.", "The capstone rubric link in module 4 was really helpful for scoping mine."]].map(([n, m]) => (
                <div key={n} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 99, background: "var(--gold-tint)", color: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{n[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
                    <div style={{ fontSize: 13, color: "var(--slate)" }}>{m}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="ks-btn ks-btn-gold"
            style={{ marginTop: 20, opacity: saving ? 0.7 : 1 }}
            disabled={saving}
            onClick={handleMarkComplete}
          >
            <CheckCircle2 size={16} />
            {saving ? "Saving…" : isLastModule ? "Mark complete & finish" : "Mark complete & continue"}
          </button>
        </div>

        <div>
          <div className="ks-card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Course progress</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--gold-dark)" }}>{Math.round((Math.min(activeModule, modules.length) / modules.length) * 100)}%</span>
            </div>
            <div style={{ height: 8, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(Math.min(activeModule, modules.length) / modules.length) * 100}%`, background: "var(--gold)", borderRadius: 4, transition: "width .2s ease" }} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 8, marginBottom: 14 }}>{Math.min(activeModule, modules.length)} of {modules.length} modules complete</div>
            <hr className="ks-hairline" style={{ margin: "0 0 10px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {modules.map((m, i) => (
                <div key={m.id} onClick={() => setActiveModule(i)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", borderRadius: 8, cursor: "pointer",
                  background: i === activeModule ? "var(--gold-tint)" : "transparent",
                }}>
                  {i < activeModule ? <CheckCircle2 size={15} color="var(--success)" /> : i === activeModule ? <PlayCircle size={15} color="var(--gold-dark)" /> : <span style={{ width: 15, height: 15, borderRadius: 99, border: "1.5px solid var(--line)", flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, fontWeight: i === activeModule ? 600 : 400 }}>{m.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ks-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 10 }}>Grades</div>
            {["Module 1 quiz", "Module 2 quiz"].map((g, i) => (
              <div key={g} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0" }}>
                <span style={{ color: "var(--slate)" }}>{g}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{i === 0 ? "9/10" : "10/10"}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0" }}>
              <span style={{ color: "var(--slate-light)" }}>Module {activeModule + 1} quiz</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--slate-light)" }}>Not yet taken</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}