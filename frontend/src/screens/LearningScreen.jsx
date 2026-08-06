import { useState, useEffect } from "react";
import { PlayCircle, CheckCircle2, XCircle, ChevronLeft} from "lucide-react";


export function LearningScreen({ course, enrollment, onSaveProgress, onFetchQuiz, onSubmitQuiz, onFetchNote, onSaveNote, onFetchPosts, onCreatePost, onBack }) {
  const [tab, setTab] = useState("video");

  const modules = course?.modules ?? [];

  const initialActiveModule = enrollment
    ? Math.min(Math.round(enrollment.progress * modules.length), modules.length)
    : 0;

  const [activeModule, setActiveModule] = useState(initialActiveModule);
  const [saving, setSaving] = useState(false);

  // Quiz state — reset whenever the active module changes, since each
  // module has its own separate quiz.
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: optionId }
  const [quizResult, setQuizResult] = useState(null); // set after submitting
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Notes state
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSavedAt, setNoteSavedAt] = useState(null);

  // Forum state
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [postingError, setPostingError] = useState(null);
  const [posting, setPosting] = useState(false);

  const currentModule = modules[activeModule];

  useEffect(() => {
    if (!currentModule || !onFetchQuiz) return;

    setQuizQuestions([]);
    setSelectedAnswers({});
    setQuizResult(null);
    setQuizError(null);
    setQuizLoading(true);

    onFetchQuiz(currentModule.id)
      .then((data) => setQuizQuestions(data))
      .catch((err) => setQuizError(err.message))
      .finally(() => setQuizLoading(false));
    // Intentionally scoped to currentModule.id only: onFetchQuiz is
    // recreated on every App.jsx render (not memoized), so including it
    // here would refetch on every keystroke/state change anywhere in the
    // app, not just on actual module navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule?.id]);

  useEffect(() => {
    if (!currentModule || !onFetchNote) return;

    setNoteContent("");
    setNoteSavedAt(null);
    setNoteLoading(true);

    onFetchNote(currentModule.id)
      .then((data) => {
        setNoteContent(data.content ?? "");
        setNoteSavedAt(data.updatedAt);
      })
      .catch((err) => console.error("Failed to load note:", err.message))
      .finally(() => setNoteLoading(false));
    // See quiz effect above for why onFetchNote/currentModule are
    // intentionally omitted from the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule?.id]);

  useEffect(() => {
    if (!currentModule || !onFetchPosts) return;

    setPosts([]);
    setNewPostContent("");
    setPostingError(null);
    setPostsLoading(true);

    onFetchPosts(currentModule.id)
      .then((data) => setPosts(data))
      .catch((err) => console.error("Failed to load forum posts:", err.message))
      .finally(() => setPostsLoading(false));
    // See quiz effect above for why onFetchPosts/currentModule are
    // intentionally omitted from the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule?.id]);

  if (!course) return null;

  const hasModules = modules.length > 0;
  const isComplete = activeModule >= modules.length;
  const isLastModule = activeModule >= modules.length - 1;

  async function handleMarkComplete() {
    const nextActiveModule = isLastModule ? modules.length : activeModule + 1;
    setActiveModule(nextActiveModule);

    if (!enrollment || !onSaveProgress) return;

    setSaving(true);
    try {
      await onSaveProgress(enrollment.id, nextActiveModule);
    } catch (err) {
      console.error("Failed to save progress:", err.message);
    } finally {
      setSaving(false);
    }
  }

  function selectAnswer(questionId, optionId) {
    if (quizResult) return; // locked once submitted
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmitQuiz() {
    if (!currentModule || !onSubmitQuiz) return;

    const answers = quizQuestions.map((q) => ({
      questionId: q.id,
      optionId: selectedAnswers[q.id],
    }));

    if (answers.some((a) => !a.optionId)) {
      setQuizError("Answer every question before submitting.");
      return;
    }

    setQuizError(null);
    setSubmittingQuiz(true);
    try {
      const result = await onSubmitQuiz(currentModule.id, answers);
      setQuizResult(result);
    } catch (err) {
      setQuizError(err.message || "Failed to submit quiz.");
    } finally {
      setSubmittingQuiz(false);
    }
  }

  async function handleNoteBlur() {
    if (!currentModule || !onSaveNote) return;

    setNoteSaving(true);
    try {
      const saved = await onSaveNote(currentModule.id, noteContent);
      setNoteSavedAt(saved.updatedAt);
    } catch (err) {
      console.error("Failed to save note:", err.message);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleCreatePost() {
    if (!currentModule || !onCreatePost || !newPostContent.trim()) return;

    setPostingError(null);
    setPosting(true);
    try {
      const post = await onCreatePost(currentModule.id, newPostContent.trim());
      setPosts((prev) => [...prev, post]);
      setNewPostContent("");
    } catch (err) {
      setPostingError(err.message || "Failed to post.");
    } finally {
      setPosting(false);
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
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onBlur={handleNoteBlur}
                disabled={noteLoading}
                placeholder="Jot down notes for this module — only visible to you."
                style={{ width: "100%", minHeight: 120, border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 13.5, resize: "vertical", background: "transparent" }}
              />
              <div style={{ fontSize: 11.5, color: "var(--slate-light)", marginTop: 8 }}>
                {noteLoading
                  ? "Loading…"
                  : noteSaving
                  ? "Saving…"
                  : noteSavedAt
                  ? `Saved ${new Date(noteSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Not saved yet"}
              </div>
            </div>
          )}
          {tab === "quiz" && (
            <div className="ks-card" style={{ padding: 18 }}>
              {quizLoading ? (
                <div style={{ fontSize: 13.5, color: "var(--slate-light)" }}>Loading quiz…</div>
              ) : quizQuestions.length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--slate-light)" }}>
                  This module doesn't have a quiz yet.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
                    Quick check — {quizQuestions.length} question{quizQuestions.length === 1 ? "" : "s"}
                    {quizResult && ` — ${quizResult.score}/${quizResult.total}${quizResult.alreadySubmitted ? " (already submitted)" : ""}`}
                  </div>

                  {quizQuestions.map((q, i) => {
                    const resultForQuestion = quizResult?.results.find((r) => r.questionId === q.id);
                    return (
                      <div key={q.id} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 8 }}>{i + 1}. {q.question}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {q.options.map((o) => {
                            const isSelected = selectedAnswers[q.id] === o.id;
                            const isCorrectAnswer = resultForQuestion?.correctOptionId === o.id;
                            const isWrongSelected = resultForQuestion && isSelected && !resultForQuestion.isCorrect;

                            let borderColor = "var(--line)";
                            let bg = "transparent";
                            if (resultForQuestion) {
                              if (isCorrectAnswer) { borderColor = "var(--success)"; bg = "var(--success-tint)"; }
                              else if (isWrongSelected) { borderColor = "var(--coral)"; bg = "var(--coral-tint)"; }
                            } else if (isSelected) {
                              borderColor = "var(--gold-dark)";
                              bg = "var(--gold-tint)";
                            }

                            return (
                              <span
                                key={o.id}
                                onClick={() => selectAnswer(q.id, o.id)}
                                style={{
                                  fontSize: 12.5, border: `1px solid ${borderColor}`, background: bg,
                                  borderRadius: 8, padding: "6px 12px", cursor: quizResult ? "default" : "pointer",
                                  display: "flex", alignItems: "center", gap: 5,
                                }}
                              >
                                {resultForQuestion && isCorrectAnswer && <CheckCircle2 size={13} color="var(--success)" />}
                                {resultForQuestion && isWrongSelected && <XCircle size={13} color="var(--coral)" />}
                                {o.optionText}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {quizError && <div style={{ fontSize: 12.5, color: "var(--coral)", marginBottom: 10 }}>{quizError}</div>}

                  {!quizResult && (
                    <button
                      className="ks-btn ks-btn-gold"
                      disabled={submittingQuiz}
                      style={{ opacity: submittingQuiz ? 0.7 : 1 }}
                      onClick={handleSubmitQuiz}
                    >
                      {submittingQuiz ? "Submitting…" : "Submit answers"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          {tab === "forum" && (
            <div className="ks-card" style={{ padding: 16 }}>
              {postsLoading ? (
                <div style={{ fontSize: 13.5, color: "var(--slate-light)" }}>Loading…</div>
              ) : (
                <>
                  {posts.length === 0 ? (
                    <div style={{ fontSize: 13.5, color: "var(--slate-light)", marginBottom: 16 }}>
                      No posts yet — be the first to start the discussion.
                    </div>
                  ) : (
                    posts.map((p) => (
                      <div key={p.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 99, background: "var(--gold-tint)", color: "var(--gold-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {(p.author.name || "?")[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.author.name || "Anonymous"}</div>
                          <div style={{ fontSize: 13, color: "var(--slate)" }}>{p.content}</div>
                        </div>
                      </div>
                    ))
                  )}

                  <div style={{ marginTop: 16 }}>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Ask a question or share a thought…"
                      style={{ width: "100%", minHeight: 60, border: "1px solid var(--line)", borderRadius: 8, padding: 10, fontFamily: "var(--font-body)", fontSize: 13.5, resize: "vertical", marginBottom: 8 }}
                    />
                    {postingError && <div style={{ fontSize: 12, color: "var(--coral)", marginBottom: 8 }}>{postingError}</div>}
                    <button
                      className="ks-btn ks-btn-gold"
                      disabled={posting || !newPostContent.trim()}
                      style={{ opacity: posting || !newPostContent.trim() ? 0.6 : 1 }}
                      onClick={handleCreatePost}
                    >
                      {posting ? "Posting…" : "Post"}
                    </button>
                  </div>
                </>
              )}
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
            {quizResult ? (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0" }}>
                <span style={{ color: "var(--slate)" }}>Module {activeModule + 1} quiz</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{quizResult.score}/{quizResult.total}</span>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0" }}>
                <span style={{ color: "var(--slate-light)" }}>Module {activeModule + 1} quiz</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--slate-light)" }}>Not yet taken</span>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}