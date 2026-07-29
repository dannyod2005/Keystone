import { useState } from "react";
import { ChevronLeft, BookMarked, Plus, Trash2, Save, Video } from "lucide-react";

const TRAINER_CATEGORIES = ["Technical", "Business", "Leadership"];
const TRAINER_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const TRAINER_COLORS = ["ink", "gold", "success", "coral"];

function emptyCourseDraft() {
  return {
    id: null, // filled in on save for new courses
    title: "", provider: "", category: TRAINER_CATEGORIES[0], level: TRAINER_LEVELS[0],
    hours: 4, projects: 1, rating: 0, learners: 0, color: TRAINER_COLORS[0],
    blurb: "", agenda: [""], modules: 1, credits: [""],
    videoUrls: [""], faq: [{ q: "", a: "" }],
  };
}

export function TrainerCourseEditor({ course, onCancel, onSave, nextId }) {
  const [draft, setDraft] = useState(() => {
    if (!course) return emptyCourseDraft();
    // Clone so in-progress edits don't mutate the live course until Save.
    return {
      ...course,
      agenda: [...course.agenda],
      credits: [...course.credits],
      videoUrls: course.agenda.map((_, i) => course.videoUrls?.[i] || ""),
      faq: course.faq && course.faq.length > 0 ? course.faq.map((f) => ({ ...f })) : [{ q: "", a: "" }],
    };
  });

  function set(field, v) { setDraft((d) => ({ ...d, [field]: v })); }

  function setModule(i, field, v) {
    setDraft((d) => {
      const agenda = [...d.agenda];
      const videoUrls = [...d.videoUrls];
      if (field === "title") agenda[i] = v; else videoUrls[i] = v;
      return { ...d, agenda, videoUrls };
    });
  }
  function addModule() {
    setDraft((d) => ({ ...d, agenda: [...d.agenda, ""], videoUrls: [...d.videoUrls, ""] }));
  }
  function removeModule(i) {
    setDraft((d) => ({ ...d, agenda: d.agenda.filter((_, x) => x !== i), videoUrls: d.videoUrls.filter((_, x) => x !== i) }));
  }

  function setFaq(i, field, v) {
    setDraft((d) => { const faq = d.faq.map((f, x) => (x === i ? { ...f, [field]: v } : f)); return { ...d, faq }; });
  }
  function addFaq() { setDraft((d) => ({ ...d, faq: [...d.faq, { q: "", a: "" }] })); }
  function removeFaq(i) { setDraft((d) => ({ ...d, faq: d.faq.filter((_, x) => x !== i) })); }

  function setCredit(i, v) { setDraft((d) => ({ ...d, credits: d.credits.map((c, x) => (x === i ? v : c)) })); }
  function addCredit() { setDraft((d) => ({ ...d, credits: [...d.credits, ""] })); }
  function removeCredit(i) { setDraft((d) => ({ ...d, credits: d.credits.filter((_, x) => x !== i) })); }

  const canSave = draft.title.trim().length > 1 && draft.agenda.some((a) => a.trim().length > 0);

  function handleSave() {
    if (!canSave) return;
    const agenda = draft.agenda.filter((a) => a.trim().length > 0);
    const videoUrls = draft.agenda.map((a, i) => (a.trim().length > 0 ? draft.videoUrls[i] || "" : null)).filter((v) => v !== null);
    const faq = draft.faq.filter((f) => f.q.trim().length > 0 && f.a.trim().length > 0);
    const credits = draft.credits.filter((c) => c.trim().length > 0);
    onSave({
      ...draft,
      id: draft.id || nextId(),
      agenda, videoUrls, faq, credits,
      modules: agenda.length,
      hours: Number(draft.hours) || 0,
      projects: Number(draft.projects) || 0,
    });
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
        {draft.agenda.map((title, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--slate-light)", width: 20, marginTop: 9 }}>{String(i + 1).padStart(2, "0")}</span>
            <div style={{ flex: 1 }}>
              <input style={{ ...rowInput, marginBottom: 6 }} value={title} onChange={(e) => setModule(i, "title", e.target.value)} placeholder="Module title" />
              {/* ASSUMPTION: URL-based video only (paste a YouTube/Vimeo embed
                  link) — direct file upload is out of scope without a real
                  backend/storage layer, per the brief's default. */}
              <input style={rowInput} value={draft.videoUrls[i] || ""} onChange={(e) => setModule(i, "video", e.target.value)}
                placeholder="Video embed URL (e.g. https://www.youtube.com/embed/...)" />
            </div>
            <Trash2 size={16} color="var(--slate-light)" style={{ cursor: "pointer", marginTop: 10 }} onClick={() => removeModule(i)} />
          </div>
        ))}
        <button className="ks-btn ks-btn-ghost" style={{ fontSize: 13, padding: "7px 12px" }} onClick={addModule}><Plus size={13} /> Add module</button>
      </div>

      <div className="ks-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 14 }}>FAQ</div>
        {draft.faq.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <input style={{ ...rowInput, marginBottom: 6 }} value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} placeholder="Question" />
              <input style={rowInput} value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} placeholder="Answer" />
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
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input style={rowInput} value={c} onChange={(e) => setCredit(i, e.target.value)} placeholder="e.g. Curriculum & instruction: ..." />
            <Trash2 size={16} color="var(--slate-light)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => removeCredit(i)} />
          </div>
        ))}
        <button className="ks-btn ks-btn-ghost" style={{ fontSize: 13, padding: "7px 12px" }} onClick={addCredit}><Plus size={13} /> Add credit line</button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="ks-btn ks-btn-gold" style={{ opacity: canSave ? 1 : 0.5 }} disabled={!canSave} onClick={handleSave}>
          <Save size={15} /> Save course
        </button>
        <button className="ks-btn ks-btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
      {!canSave && <div style={{ fontSize: 12, color: "var(--slate-light)", marginTop: 8 }}>Add a title and at least one module to save.</div>}
    </div>
  );
}