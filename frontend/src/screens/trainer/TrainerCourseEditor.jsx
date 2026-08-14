import { useState, useRef, useEffect } from "react";
import { ChevronLeft, BookMarked, Plus, Trash2, Save, Video, ChevronDown, ChevronUp, HelpCircle, X } from "lucide-react";

const TRAINER_CATEGORIES = ["Technical", "Business", "Leadership"];
const TRAINER_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const TRAINER_COLORS = ["ink", "gold", "success", "coral"];

function emptyCourseDraft() {
  return {
    title: "", provider: "", category: TRAINER_CATEGORIES[0], level: TRAINER_LEVELS[0],
    hours: 4, color: TRAINER_COLORS[0],
    blurb: "",
    skills: [],
    modules: [{ title: "", videoUrl: "" }],
    credits: [{ line: "" }],
    faqs: [{ question: "", answer: "" }],
  };
}

function emptyQuestion() {
  return {
    question: "",
    // #40 — 'mcq' (default) or 'short_answer'. Both `options` and
    // `acceptableAnswers` are always kept on the question object so
    // toggling the type in the UI doesn't lose or need to re-init state;
    // only the field matching `type` is actually sent to the backend
    // (see handleSaveQuiz).
    type: "mcq",
    options: [
      { optionText: "", isCorrect: true },
      { optionText: "", isCorrect: false },
    ],
    acceptableAnswers: [""],
  };
}

// #40 — the edit-quiz fetch/save endpoints return QuizQuestionEditResponseDto
// shape, where a short_answer question's acceptable answers are carried in
// `options` (isCorrect always true — see the backend QuizOption entity
// comment). Normalize that into the editor's `acceptableAnswers` array and
// backfill a blank MCQ options pair, so the shape is uniform regardless of
// which type the question currently is.
function normalizeLoadedQuestion(q) {
  const type = q.type ?? "mcq";
  if (type === "short_answer") {
    return {
      ...q,
      type,
      acceptableAnswers: q.options && q.options.length > 0 ? q.options.map((o) => o.optionText) : [""],
      options: [
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false },
      ],
    };
  }
  return { ...q, type, acceptableAnswers: [""] };
}

export function TrainerCourseEditor({ course, onCancel, onSave, onFetchQuizForEdit, onSaveQuiz, onFetchProvider, onFetchProfile }) {

  const [quizState, setQuizState] = useState({}); // { [moduleId]: { expanded, loading, loaded, questions, saving, error } }

  // Tracks the latest save request's sequence number per module, so an
  // older, slower response can never overwrite state with stale data
  // after a newer request has already completed. useRef (not useState)
  // specifically because it updates synchronously, immediately blocking
  // a rapid double-click before React even re-renders to disable the button.
  const saveSequenceRef = useRef({});

  const [draft, setDraft] = useState(() => {
    if (!course) return emptyCourseDraft();
    return {
      title: course.title,
      // #143 — provider is now locked to the trainer's real identity
      // (Provider.name, or their own profile.name) rather than preserved
      // free text, even when editing an existing course. Left blank here
      // and resolved by the effect below, so a course previously saved
      // with old/stale provider text doesn't flash before being replaced.
      provider: "",
      category: course.category,
      level: course.level,
      hours: course.hours,
      color: course.color,
      blurb: course.blurb ?? "",
      skills: course.skills ?? [],
      modules: course.modules.map((m) => ({ id: m.id, title: m.title, videoUrl: m.videoUrl ?? "" })),
      credits: course.credits.map((c) => ({ id: c.id, line: c.line })),
      faqs: course.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    };
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // #143 — resolve the locked provider field: the trainer's Provider name
  // if they belong to one, else their own profile.name. Runs once on
  // mount — onFetchProvider/onFetchProfile are recreated on every App.jsx
  // render (not memoized), same pattern as LearningScreen's per-tab fetch
  // effects, so they're deliberately left out of the dependency array.
  const [providerFieldLoading, setProviderFieldLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([onFetchProvider(), onFetchProfile()])
      .then(([provider, profile]) => {
        if (cancelled) return;
        setDraft((d) => ({ ...d, provider: provider?.name || profile?.name || "" }));
      })
      .catch(() => {
        // Leave provider blank — canSave below keeps Save disabled until
        // this resolves, so there's no silent path to submitting an empty
        // provider string.
      })
      .finally(() => {
        if (!cancelled) setProviderFieldLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // #226 — free-text tag input: typing + Enter (or comma) commits the
  // current text as a new skill and clears the field, distinct from the
  // "list of objects with add/remove rows" pattern used above for
  // modules/credits/faqs since a skill is just a bare string, not a
  // multi-field object.
  const [skillInput, setSkillInput] = useState("");

  function addSkill(raw) {
    const value = raw.trim();
    if (!value) return;
    setDraft((d) => (d.skills.includes(value) ? d : { ...d, skills: [...d.skills, value] }));
    setSkillInput("");
  }
  function removeSkill(i) {
    setDraft((d) => ({ ...d, skills: d.skills.filter((_, x) => x !== i) }));
  }
  function handleSkillInputKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  }

  /* ---------- Quiz management ---------- */

  async function toggleQuiz(moduleId) {
    const current = quizState[moduleId];
    if (current?.expanded) {
      setQuizState((prev) => ({ ...prev, [moduleId]: { ...prev[moduleId], expanded: false } }));
      return;
    }

    setQuizState((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], expanded: true, loading: !prev[moduleId]?.loaded },
    }));

    if (current?.loaded) return; // already fetched once, just re-showing

    try {
      const questions = await onFetchQuizForEdit(moduleId);
      setQuizState((prev) => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          loading: false,
          loaded: true,
          questions: questions.length > 0 ? questions.map(normalizeLoadedQuestion) : [emptyQuestion()],
          error: null,
        },
      }));
    } catch (err) {
      setQuizState((prev) => ({
        ...prev,
        [moduleId]: { ...prev[moduleId], loading: false, error: err.message },
      }));
    }
  }

  function updateQuestions(moduleId, updater) {
    setQuizState((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], questions: updater(prev[moduleId].questions) },
    }));
  }

  function setQuestionText(moduleId, qIndex, text) {
    updateQuestions(moduleId, (qs) =>
      qs.map((q, i) => (i === qIndex ? { ...q, question: text } : q)),
    );
  }

  function addQuestion(moduleId) {
    updateQuestions(moduleId, (qs) => [...qs, emptyQuestion()]);
  }

  function removeQuestion(moduleId, qIndex) {
    updateQuestions(moduleId, (qs) => qs.filter((_, i) => i !== qIndex));
  }

  function setOptionText(moduleId, qIndex, oIndex, text) {
    updateQuestions(moduleId, (qs) =>
      qs.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, x) => (x === oIndex ? { ...o, optionText: text } : o)) }
          : q,
      ),
    );
  }

  function setCorrectOption(moduleId, qIndex, oIndex) {
    updateQuestions(moduleId, (qs) =>
      qs.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, x) => ({ ...o, isCorrect: x === oIndex })) }
          : q,
      ),
    );
  }

  function addOption(moduleId, qIndex) {
    updateQuestions(moduleId, (qs) =>
      qs.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, { optionText: "", isCorrect: false }] } : q)),
    );
  }

  function removeOption(moduleId, qIndex, oIndex) {
    updateQuestions(moduleId, (qs) =>
      qs.map((q, i) => (i === qIndex ? { ...q, options: q.options.filter((_, x) => x !== oIndex) } : q)),
    );
  }

  // #40 — question type toggle (mcq / short_answer). Switching type doesn't
  // clear the other shape's data, so accidental toggles are non-destructive.
  function setQuestionType(moduleId, qIndex, type) {
    updateQuestions(moduleId, (qs) => qs.map((q, i) => (i === qIndex ? { ...q, type } : q)));
  }

  function setAcceptableAnswer(moduleId, qIndex, aIndex, text) {
    updateQuestions(moduleId, (qs) =>
      qs.map((q, i) =>
        i === qIndex
          ? { ...q, acceptableAnswers: q.acceptableAnswers.map((a, x) => (x === aIndex ? text : a)) }
          : q,
      ),
    );
  }

  function addAcceptableAnswer(moduleId, qIndex) {
    updateQuestions(moduleId, (qs) =>
      qs.map((q, i) => (i === qIndex ? { ...q, acceptableAnswers: [...q.acceptableAnswers, ""] } : q)),
    );
  }

  function removeAcceptableAnswer(moduleId, qIndex, aIndex) {
    updateQuestions(moduleId, (qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, acceptableAnswers: q.acceptableAnswers.filter((_, x) => x !== aIndex) } : q,
      ),
    );
  }

  function quizValidationError(questions) {
    for (const q of questions) {
      if (!q.question.trim()) return "Every question needs text.";
      if (q.type === "short_answer") {
        if (q.acceptableAnswers.filter((a) => a.trim()).length < 1) {
          return "Every short-answer question needs at least 1 acceptable answer.";
        }
      } else {
        if (q.options.length < 2) return "Every question needs at least 2 options.";
        if (q.options.some((o) => !o.optionText.trim())) return "Every option needs text.";
        if (q.options.filter((o) => o.isCorrect).length !== 1) return "Every question needs exactly one correct option.";
      }
    }
    return null;
  }

  async function handleSaveQuiz(moduleId) {
    const questions = quizState[moduleId]?.questions ?? [];
    const validationError = quizValidationError(questions);
    if (validationError) {
      setQuizState((prev) => ({ ...prev, [moduleId]: { ...prev[moduleId], error: validationError } }));
      return;
    }

    const payload = {
      questions: questions.map((q) => ({
        ...(q.id ? { id: q.id } : {}),
        question: q.question,
        type: q.type,
        ...(q.type === "short_answer"
          ? { acceptableAnswers: q.acceptableAnswers.map((a) => a.trim()).filter((a) => a.length > 0) }
          : {
              options: q.options.map((o) => ({
                ...(o.id ? { id: o.id } : {}),
                optionText: o.optionText,
                isCorrect: o.isCorrect,
              })),
            }),
      })),
    };

    // Claim this as the latest request for this module, synchronously —
    // any earlier in-flight request for the same module is now stale.
    const mySequence = (saveSequenceRef.current[moduleId] ?? 0) + 1;
    saveSequenceRef.current[moduleId] = mySequence;

    setQuizState((prev) => ({ ...prev, [moduleId]: { ...prev[moduleId], saving: true, error: null } }));
    try {
      const saved = await onSaveQuiz(moduleId, payload);

      // If a newer request has started since this one began, this
      // response is stale — discard it rather than overwrite fresher
      // (or in-flight) state.
      if (saveSequenceRef.current[moduleId] !== mySequence) return;

      setQuizState((prev) => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          saving: false,
          questions: saved.length > 0 ? saved.map(normalizeLoadedQuestion) : [emptyQuestion()],
        },
      }));
    } catch (err) {
      if (saveSequenceRef.current[moduleId] !== mySequence) return;
      setQuizState((prev) => ({
        ...prev,
        [moduleId]: { ...prev[moduleId], saving: false, error: err.message },
      }));
    }
  }

  /* ---------- Course save ---------- */

  const canSave =
    draft.title.trim().length > 1 &&
    draft.modules.some((m) => m.title.trim().length > 0) &&
    draft.provider.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;

    const payload = {
      title: draft.title,
      provider: draft.provider,
      category: draft.category,
      level: draft.level,
      hours: Number(draft.hours) || 0,
      color: draft.color,
      blurb: draft.blurb || undefined,
      skills: draft.skills,
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
    } catch (err) {
      setSaveError(err.message || "Failed to save course. Please try again.");
      setSaving(false);
    }
  }

  const field = { marginBottom: 16 };
  const label = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 };
  const rowInput = { fontFamily: "var(--font-body)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 13, width: "100%", background: "var(--paper-2)", outline: "none" };

  return (
    <div className="ks-page-enter" style={{ padding: "28px 32px 60px", maxWidth: 760 }}>
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
            <input
              style={{ ...rowInput, background: "var(--line)", color: "var(--slate)", cursor: "not-allowed" }}
              value={providerFieldLoading ? "" : draft.provider}
              placeholder={providerFieldLoading ? "Loading…" : ""}
              disabled
              readOnly
            />
            <div style={{ fontSize: 11, color: !providerFieldLoading && !draft.provider ? "var(--coral)" : "var(--slate-light)", marginTop: 4 }}>
              {!providerFieldLoading && !draft.provider
                ? "Couldn't resolve your name or provider — try reopening the editor."
                : "Auto-filled from your provider (or your account name) — trainers can't edit this directly."}
            </div>
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
        <div>
          <label style={label}>Skill tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {draft.skills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--ink)", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 999, padding: "4px 10px" }}
              >
                {s}
                <X size={12} style={{ cursor: "pointer" }} onClick={() => removeSkill(i)} />
              </span>
            ))}
          </div>
          <input
            style={rowInput}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillInputKeyDown}
            onBlur={() => addSkill(skillInput)}
            placeholder="Type a skill and press Enter (e.g. Git, SQL, Negotiation)"
          />
        </div>
      </div>

      <div className="ks-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
          <Video size={14} color="var(--slate-light)" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Modules &amp; video</span>
        </div>
        {draft.modules.map((m, i) => {
          const qState = m.id ? quizState[m.id] : null;
          return (
            <div key={m.id ?? `new-${i}`} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--slate-light)", width: 20, marginTop: 9 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <input style={{ ...rowInput, marginBottom: 6 }} value={m.title} onChange={(e) => setModule(i, "title", e.target.value)} placeholder="Module title" />
                  <input style={rowInput} value={m.videoUrl || ""} onChange={(e) => setModule(i, "videoUrl", e.target.value)}
                    placeholder="Video embed URL (e.g. https://www.youtube.com/embed/...)" />
                </div>
                <Trash2 size={16} color="var(--slate-light)" style={{ cursor: "pointer", marginTop: 10 }} onClick={() => removeModule(i)} />
              </div>

              {m.id ? (
                <div style={{ marginLeft: 28, marginTop: 6 }}>
                  <span
                    onClick={() => toggleQuiz(m.id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "var(--gold-dark)", cursor: "pointer" }}
                  >
                    <HelpCircle size={13} />
                    Manage quiz
                    {qState?.expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </span>

                  {qState?.expanded && (
                    <div className="ks-card" style={{ padding: 14, marginTop: 8, background: "var(--paper)" }}>
                      {qState.loading ? (
                        <div style={{ fontSize: 12.5, color: "var(--slate-light)" }}>Loading quiz…</div>
                      ) : (
                        <>
                          {(qState.questions ?? []).map((q, qIndex) => (
                            <div key={q.id ?? `newq-${qIndex}`} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                                <input
                                  style={rowInput}
                                  value={q.question}
                                  onChange={(e) => setQuestionText(m.id, qIndex, e.target.value)}
                                  placeholder={`Question ${qIndex + 1}`}
                                />
                                <select
                                  style={{ ...rowInput, width: "auto", flexShrink: 0 }}
                                  value={q.type}
                                  onChange={(e) => setQuestionType(m.id, qIndex, e.target.value)}
                                  title="Question type"
                                >
                                  <option value="mcq">Multiple choice</option>
                                  <option value="short_answer">Short answer</option>
                                </select>
                                <Trash2 size={15} color="var(--slate-light)" style={{ cursor: "pointer", marginTop: 9, flexShrink: 0 }} onClick={() => removeQuestion(m.id, qIndex)} />
                              </div>
                              {q.type === "short_answer" ? (
                                <>
                                  {q.acceptableAnswers.map((a, aIndex) => (
                                    <div key={aIndex} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, marginLeft: 12 }}>
                                      <input
                                        style={{ ...rowInput, flex: 1 }}
                                        value={a}
                                        onChange={(e) => setAcceptableAnswer(m.id, qIndex, aIndex, e.target.value)}
                                        placeholder={`Acceptable answer ${aIndex + 1}`}
                                      />
                                      <Trash2 size={14} color="var(--slate-light)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => removeAcceptableAnswer(m.id, qIndex, aIndex)} />
                                    </div>
                                  ))}
                                  <span
                                    onClick={() => addAcceptableAnswer(m.id, qIndex)}
                                    style={{ fontSize: 12, color: "var(--gold-dark)", fontWeight: 600, cursor: "pointer", marginLeft: 12 }}
                                  >
                                    + Add acceptable answer
                                  </span>
                                </>
                              ) : (
                                <>
                                  {q.options.map((o, oIndex) => (
                                    <div key={o.id ?? `newo-${oIndex}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, marginLeft: 12 }}>
                                      <input
                                        type="radio"
                                        name={`correct-${m.id}-${qIndex}`}
                                        checked={o.isCorrect}
                                        onChange={() => setCorrectOption(m.id, qIndex, oIndex)}
                                        title="Mark as correct answer"
                                      />
                                      <input
                                        style={{ ...rowInput, flex: 1 }}
                                        value={o.optionText}
                                        onChange={(e) => setOptionText(m.id, qIndex, oIndex, e.target.value)}
                                        placeholder={`Option ${oIndex + 1}`}
                                      />
                                      <Trash2 size={14} color="var(--slate-light)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => removeOption(m.id, qIndex, oIndex)} />
                                    </div>
                                  ))}
                                  <span
                                    onClick={() => addOption(m.id, qIndex)}
                                    style={{ fontSize: 12, color: "var(--gold-dark)", fontWeight: 600, cursor: "pointer", marginLeft: 12 }}
                                  >
                                    + Add option
                                  </span>
                                </>
                              )}
                            </div>
                          ))}

                          <button className="ks-btn ks-btn-ghost" style={{ fontSize: 12.5, padding: "6px 12px", marginRight: 8 }} onClick={() => addQuestion(m.id)}>
                            <Plus size={12} /> Add question
                          </button>
                          <button
                            className="ks-btn ks-btn-gold"
                            style={{ fontSize: 12.5, padding: "6px 12px", opacity: qState.saving ? 0.7 : 1 }}
                            disabled={qState.saving}
                            onClick={() => handleSaveQuiz(m.id)}
                          >
                            {qState.saving ? "Saving…" : "Save quiz"}
                          </button>

                          {qState.error && <div style={{ fontSize: 12, color: "var(--coral)", marginTop: 8 }}>{qState.error}</div>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginLeft: 28, marginTop: 4, fontSize: 11.5, color: "var(--slate-light)" }}>
                  Save the course first to add quiz questions to this module.
                </div>
              )}
            </div>
          );
        })}
        <button className="ks-btn ks-btn-ghost" style={{ fontSize: 13, padding: "7px 12px", marginTop: 4 }} onClick={addModule}><Plus size={13} /> Add module</button>
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