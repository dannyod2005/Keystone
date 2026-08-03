import { useState } from "react";
import { ChevronLeft, BookMarked, Plus, Trash2, Save, Video } from "lucide-react";

const TRAINER_CATEGORIES = ["Technical", "Business", "Leadership"];
const TRAINER_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const TRAINER_COLORS = ["ink", "gold", "success", "coral"];

function emptyCourseDraft() {
  return {
    title: "", provider: "", category: TRAINER_CATEGORIES[0], level: TRAINER_LEVELS[0],
    hours: 4, projects: 1, color: TRAINER_COLORS[0],
    blurb: "",
    modules: [{ title: "", videoUrl: "" }],
    credits: [{ line: "" }],
    faqs: [{ question: "", answer: "" }],
  };
}

export function TrainerCourseEditor({ course, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => {
    if (!course) return emptyCourseDraft();
    // Clone so in-progress edits don't mutate the live course until Save.
    // Each item keeps its real database id — that's what lets PUT preserve
    // identity instead of deleting and recreating everything on save.
    return {
      title: course.title,
      provider: course.provider,
      category: course.category,
      level: course.level,
      hours: course.hours,
      projects: course.projects,
      color: course.color,
      blurb: course.blurb ?? "",
      modules: course.modules.map((m) => ({ id: m.id, title: m.title, videoUrl: m.videoUrl ?? "" })),
      credits: course.credits.map((c) => ({ id: c.id, line: c.line })),
      faqs: course.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    };
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  function set(field, v) { setDraft((d) => ({ ...d, [field]: v })); }

  function setModule(i, field, v) {
    setDraft((d) => ({
      ...d,
      modules: d.modules.map((m, x) => (x === i ? { ...m, [field]: v } : m)),
    }));
  }
  function addModule() {
    setDraft((d) => ({ ...d, modules: [...d.modules, { title: "", videoUrl: "" }] }));
  }
  function removeModule(i) {
    setDraft((d) => ({ ...d, modules: d.modules.filter((_, x) => x !== i) }));
  }

  function setFaq(i, field, v) {
    setDraft((d) => ({
      ...d,
      faqs: d.faqs.map((f, x) => (x === i ? { ...f, [field]: v } : f)),
    }));
  }
  function addFaq() { setDraft((d) => ({ ...d, faqs: [...d.faqs, { question: "", answer: "" }] })); }
  function removeFaq(i) { setDraft((d) => ({ ...d, faqs: d.faqs.filter((_, x) => x !== i) })); }

  function setCredit(i, v) {
    setDraft((d) => ({
      ...d,
      credits: d.credits.map((c, x) => (x === i ? { ...c, line: v } : c)),
    }));
  }
  function addCredit() { setDraft((d) => ({ ...d, credits: [...d.credits, { line: "" }] })); }
  function removeCredit(i) { setDraft((d) => ({ ...d, credits: d.credits.filter((_, x) => x !== i) })); }

  const canSave = draft.title.trim().length > 1 && draft.modules.some((m) => m.title.trim().length > 0);

  async function handleSave() {
    if (!canSave) return;

    // Build a clean payload with ONLY the fields the backend DTO declares.
    // The global ValidationPipe rejects (400) any request containing extra
    // fields, so nothing beyond this shape can be sent.
    const payload = {
      title: draft.title,
      provider: draft.provider,
      category: draft.category,
      level: draft.level,
      hours: Number(draft.hours) || 0,
      projects: Number(draft.projects) || 0,
      color: draft.color,
      blurb: draft.blurb || undefined,
      modules: draft.modules
        .filter((m) => m.title.trim().length > 0)
        .map((m) => ({
          ...(m.id ? { id: m.id } : {}),
          title: m.title,
          videoUrl: m.videoUrl || null,
        })),
      credits: draft.credits
        .filter((c) => c.line.trim().length > 0)
        .map((c) => ({ ...(c.id ? { id: c.id } : {}), line: c.line })),
      faqs: draft.faqs
        .filter((f) => f.question.trim().length > 0 && f.answer.trim().length > 0)
        .map((f) => ({
          ...(f.id ? { id: f.id } : {}),
          question: f.question,
          answer: f.answer,
        })),
    };

    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ id: course?.id ?? null, payload });
      // On success, the parent (TrainerScreen) unmounts this component —
      // no need to reset saving/error state here.
    } catch (err) {
      setSaveError(err.message || "Failed to save course. Please try again.");
      setSaving(false);
    }
  }

  const field = { marginBottom: 16 };
  const label = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 };
  const rowInput = { fontFamily: "var(--font-body)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 13, width: "100%", background: "var(--paper-2)", outline: "none" };

  return (
    <div style={{ padding: "28px 32px 60px", maxWidth: 760 }}>
      <div onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--slate)", cursor: "pointer", marginBottom: 14 }}>
        <ChevronLeft size={15} /> Back to Trainer studio
      </div>
      <div style={{ fontSize: 19, fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 18 }}>
        {course ? "Edit course" : "New course"}
      </div>

      <div className="ks-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 14 }}>Catalogue details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={field}>
            <label style={label}>Title</label>
            <input style={rowInput} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Course title" />
          </div>
          <div style={field}>
            <label style={label}>Provider</label>
            <input style={rowInput} value={draft.provider} onChange={(e) => set("provider", e.target.value)} placeholder="e.g. Keystone Business School" />
          </div>
          <div style={field}>
            <label style={label}>Track</label>
            <select style={rowInput} value={draft.category} onChange={(e) => set("category", e.target.value)}>
              {TRAINER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={field}>
            <label style={label}>Level</label>
            <select style={rowInput} value={draft.level} onChange={(e) => set("level", e.target.value)}>
              {TRAINER_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={field}>
            <label style={label}>Hours</label>
            <input style={rowInput} type="number" min={0} value={draft.hours} onChange={(e) => set("hours", e.target.value)} />
          </div>
          <div style={field}>
            <label style={label}>Accent color</label>
            <select style={rowInput} value={draft.color} onChange={(e) => set("color", e.target.value)}>
              {TRAINER_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={field}>
          <label style={label}>Summary</label>
          <textarea style={{ ...rowInput, minHeight: 70, resize: "vertical" }} value={draft.blurb} onChange={(e) => set("blurb", e.target.value)} placeholder="One or two sentences a learner sees on the catalogue card." />
        </div>
      </div>

      <div className="ks-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
          <Video size={14} color="var(--slate-light)" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Modules &amp; video</span>
        </div>
        {draft.modules.map((m, i) => (
          <div key={m.id ?? `new-${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--slate-light)", width: 20, marginTop: 9 }}>{String(i + 1).padStart(2, "0")}</span>
            <div style={{ flex: 1 }}>
              <input style={{ ...rowInput, marginBottom: 6 }} value={m.title} onChange={(e) => setModule(i, "title", e.target.value)} placeholder="Module title" />
              <input style={rowInput} value={m.videoUrl || ""} onChange={(e) => setModule(i, "videoUrl", e.target.value)}
                placeholder="Video embed URL (e.g. https://www.youtube.com/embed/...)" />
            </div>
            <Trash2 size={16} color="var(--slate-light)" style={{ cursor: "pointer", marginTop: 10 }} onClick={() => removeModule(i)} />
          </div>
        ))}
        <button className="ks-btn ks-btn-ghost" style={{ fontSize: 13, padding: "7px 12px" }} onClick={addModule}><Plus size={13} /> Add module</button>
      </div>

      <div className="ks-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 14 }}>FAQ</div>
        {draft.faqs.map((f, i) => (
          <div key={f.id ?? `new-${i}`} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <input style={{ ...rowInput, marginBottom: 6 }} value={f.question} onChange={(e) => setFaq(i, "question", e.target.value)} placeholder="Question" />
              <input style={rowInput} value={f.answer} onChange={(e) => setFaq(i, "answer", e.target.value)} placeholder="Answer" />
            </div>
            <Trash2 size={16} color="var(--slate-light)" style={{ cursor: "pointer", marginTop: 10 }} onClick={() => removeFaq(i)} />
          </div>
        ))}
        <button className="ks-btn ks-btn-ghost" style={{ fontSize: 13, padding: "7px 12px" }} onClick={addFaq}><Plus size={13} /> Add FAQ item</button>
      </div>

      <div className="ks-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
          <BookMarked size={13} color="var(--slate-light)" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Sources &amp; credits</span>
        </div>
        {draft.credits.map((c, i) => (
          <div key={c.id ?? `new-${i}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input style={rowInput} value={c.line} onChange={(e) => setCredit(i, e.target.value)} placeholder="e.g. Curriculum & instruction: ..." />
            <Trash2 size={16} color="var(--slate-light)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => removeCredit(i)} />
          </div>
        ))}
        <button className="ks-btn ks-btn-ghost" style={{ fontSize: 13, padding: "7px 12px" }} onClick={addCredit}><Plus size={13} /> Add credit line</button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="ks-btn ks-btn-gold" style={{ opacity: canSave && !saving ? 1 : 0.5 }} disabled={!canSave || saving} onClick={handleSave}>
          <Save size={15} /> {saving ? "Saving…" : "Save course"}
        </button>
        <button className="ks-btn ks-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
      {!canSave && <div style={{ fontSize: 12, color: "var(--slate-light)", marginTop: 8 }}>Add a title and at least one module to save.</div>}
      {saveError && <div style={{ fontSize: 12.5, color: "var(--coral)", marginTop: 8 }}>{saveError}</div>}
    </div>
  );
}