import React, { useState, useEffect } from "react";
import {
  Search, PlayCircle, CheckCircle2, Award, Calendar as CalendarIcon,
  Clock, BookOpen, MessageSquare, ChevronDown, X,
  ArrowRight, LayoutGrid, GraduationCap, ChevronLeft,
  ChevronRight, Flame, Home as HomeIcon, HelpCircle, Menu,
  Mail, Lock, User, BookMarked, Eye, EyeOff,
  Pencil, Plus, Trash2, Video, Save
} from "lucide-react";

import { INITIAL_COURSES, ENROLLED_DEFAULT, TESTIMONIALS, LEARNER } from "./data/courses";
import { Stars, KeystoneArch, CategoryDot } from "./components/common/Primitives";

import { MarketingHeader } from "./components/layout/MarketingHeader";
import { AppSidebar} from "./components/layout/AppSidebar"
import { AppTopbar } from "./components/layout/AppTopbar";

import { CourseDetailModal } from "./components/modals/CourseDetailModal";
import { AuthModal } from "./components/modals/AuthModal";

import { HomeScreen } from "./screens/HomeScreen";
import { CatalogueScreen } from "./screens/CatalogueScreen";

/* ---------------------------------------------------------------
   KEYSTONE LEARNING — clickable prototype
--------------------------------------------------------------- */

/* ---------- Screen: Dashboard ---------- */

function DashboardScreen({ enrolled, onOpenCourse, onStartLearning, courses }) {
  const inProgress = enrolled.filter((e) => e.status === "in-progress");
  const complete = enrolled.filter((e) => e.status === "complete");

  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const goalDays = [true, true, false, true, true, false, false];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div className="ks-card" style={{ padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Good morning, {LEARNER.name.split(" ")[0]}</div>
          <div style={{ fontSize: 13, color: "var(--slate)", marginTop: 2 }}>Your goal: <b style={{ color: "var(--ink)" }}>{LEARNER.goal}</b></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gold-tint)", padding: "8px 14px", borderRadius: 100 }}>
          <Flame size={16} color="var(--gold-dark)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-dark)" }}>{LEARNER.streak}-day streak</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
            {[
              { label: "In progress", value: inProgress.length, icon: PlayCircle, tint: "var(--gold-tint)", fg: "var(--gold-dark)" },
              { label: "Completed", value: complete.length, icon: CheckCircle2, tint: "var(--success-tint)", fg: "var(--success)" },
              { label: "Certificates", value: complete.length, icon: Award, tint: "var(--coral-tint)", fg: "var(--coral)" },
            ].map((s) => (
              <div key={s.label} className="ks-card" style={{ flex: 1, padding: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: s.tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <s.icon size={15} color={s.fg} />
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: "var(--slate-light)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 12 }}>Continue learning</div>
          {inProgress.map((e) => {
            const c = courses.find((x) => x.id === e.courseId);
            return (
              <div key={e.courseId} className="ks-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                <KeystoneArch progress={e.progress} size={48} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>
                    {Math.round(e.progress * c.modules)} of {c.modules} modules · last opened {e.lastAccessed}
                  </div>
                  <div style={{ height: 5, background: "var(--line)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${e.progress * 100}%`, background: "var(--gold)" }} />
                  </div>
                </div>
                <button className="ks-btn ks-btn-primary" onClick={() => onStartLearning(c)}>Resume</button>
              </div>
            );
          })}

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", margin: "24px 0 12px" }}>Completed</div>
          {complete.map((e) => {
            const c = courses.find((x) => x.id === e.courseId);
            return (
              <div key={e.courseId} className="ks-card" style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={22} color="var(--success)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>Completed {e.lastAccessed} · certificate issued</div>
                </div>
                <button className="ks-btn ks-btn-ghost">View certificate</button>
              </div>
            );
          })}
        </div>

        <div>
          <div className="ks-card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>July 2026</span>
              <div style={{ display: "flex", gap: 6 }}>
                <ChevronLeft size={14} color="var(--slate-light)" />
                <ChevronRight size={14} color="var(--slate-light)" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center" }}>
              {days.map((d, i) => <div key={i} style={{ fontSize: 11, color: "var(--slate-light)" }}>{d}</div>)}
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{
                  fontSize: 12, padding: "5px 0", borderRadius: 6,
                  background: i === 8 ? "var(--gold)" : goalDays[i % 7] ? "var(--gold-tint)" : "transparent",
                  color: i === 8 ? "#2B1E06" : "var(--ink)", fontWeight: i === 8 ? 700 : 400,
                }}>{i + 1}</div>
              ))}
            </div>
            <hr className="ks-hairline" style={{ margin: "16px 0" }} />
            <div style={{ fontSize: 12.5, color: "var(--slate)" }}>Daily goal · {LEARNER.dailyGoalMin} min</div>
            <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 2 }}>{LEARNER.goalHitDays} of 7 days hit this week</div>
          </div>

          <div className="ks-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 12 }}>This week</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 500 }}>{LEARNER.minutesThisWeek}<span style={{ fontSize: 13, color: "var(--slate-light)" }}> min</span></div>
            <div style={{ fontSize: 12, color: "var(--slate-light)" }}>learned across {inProgress.length + complete.length} courses</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Screen: Learning page ---------- */

function LearningScreen({ course, onBack }) {
  const [tab, setTab] = useState("video");
  const [activeModule, setActiveModule] = useState(2);

  if (!course) return null;

  return (
    <div style={{ padding: "22px 32px 40px", maxWidth: 1080 }}>
      <div onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--slate)", cursor: "pointer", marginBottom: 14 }}>
        <ChevronLeft size={15} /> Back to My learning
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 22 }}>
        <div>
          <div className="ks-card" style={{ padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Module {activeModule + 1} of {course.modules}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{course.agenda[activeModule]}</div>
          </div>

          {/* ASSUMPTION: course.videoUrls[i] is a new optional field a trainer
              can set per module (see TrainerScreen). If present, embed it in
              an iframe (works for YouTube/Vimeo-style embed URLs); otherwise
              fall back to the original placeholder so untouched courses look
              exactly as before. */}
          {course.videoUrls?.[activeModule] ? (
            <div style={{ background: "var(--ink)", borderRadius: 14, aspectRatio: "16/9", overflow: "hidden", marginBottom: 4 }}>
              <iframe
                key={course.videoUrls[activeModule]}
                src={course.videoUrls[activeModule]}
                title={course.agenda[activeModule]}
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
            {course.videoUrls?.[activeModule] ? course.agenda[activeModule] : `12:40 · ${course.agenda[activeModule]}`}
          </div>

          <div style={{ display: "flex", gap: 20, borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
            {["video", "notes", "quiz", "forum"].map((t) => (
              <div key={t} className={`ks-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</div>
            ))}
          </div>

          {tab === "video" && (
            <p style={{ fontSize: 14, color: "var(--slate)", lineHeight: 1.6 }}>
              This module covers {course.agenda[activeModule].toLowerCase()}. Follow along in the video, then apply it in the short exercise before moving to the quiz.
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
            style={{ marginTop: 20, opacity: activeModule >= course.modules - 1 ? 0.5 : 1 }}
            disabled={activeModule >= course.modules - 1}
            onClick={() => setActiveModule((m) => Math.min(m + 1, course.modules - 1))}
          >
            <CheckCircle2 size={16} />
            {activeModule >= course.modules - 1 ? "Course complete" : "Mark complete & continue"}
          </button>
        </div>

        <div>
          <div className="ks-card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Course progress</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--gold-dark)" }}>{Math.round((activeModule / course.modules) * 100)}%</span>
            </div>
            <div style={{ height: 8, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(activeModule / course.modules) * 100}%`, background: "var(--gold)", borderRadius: 4, transition: "width .2s ease" }} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginTop: 8, marginBottom: 14 }}>{activeModule} of {course.modules} modules complete</div>
            <hr className="ks-hairline" style={{ margin: "0 0 10px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {course.agenda.map((a, i) => (
                <div key={a} onClick={() => setActiveModule(i)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", borderRadius: 8, cursor: "pointer",
                  background: i === activeModule ? "var(--gold-tint)" : "transparent",
                }}>
                  {i < activeModule ? <CheckCircle2 size={15} color="var(--success)" /> : i === activeModule ? <PlayCircle size={15} color="var(--gold-dark)" /> : <span style={{ width: 15, height: 15, borderRadius: 99, border: "1.5px solid var(--line)", flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, fontWeight: i === activeModule ? 600 : 400 }}>{a}</span>
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
    </div>
  );
}

/* ---------- Screen: Trainer studio ---------- */
// NEW: everything in this section is additive — it doesn't change how any
// learner-facing component reads course data, it just gives trainers a form
// that writes into the same `courses` array (same shape as INITIAL_COURSES)
// that CatalogueScreen / CourseDetailModal / DashboardScreen / LearningScreen
// already read from.

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

// ASSUMPTION: simple incrementing id scheme (c7, c8, ...) since there's no
// backend to assign real ids — just needs to be unique within `courses`.
function nextCourseId(courses) {
  let n = courses.length + 1;
  let id = `c${n}`;
  while (courses.some((c) => c.id === id)) { n += 1; id = `c${n}`; }
  return id;
}

function TrainerScreen({ courses, onSaveCourse }) {
  const [editingId, setEditingId] = useState(null); // null = list view, "__new" = creating, else course id

  const editingCourse =
    editingId === "__new" ? null :
    editingId ? courses.find((c) => c.id === editingId) : null;

  if (editingId) {
    return (
      <TrainerCourseEditor
        course={editingCourse}
        onCancel={() => setEditingId(null)}
        onSave={(draft) => { onSaveCourse(draft); setEditingId(null); }}
        nextId={() => nextCourseId(courses)}
      />
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Trainer studio</div>
          <div style={{ fontSize: 13, color: "var(--slate)", marginTop: 2 }}>Add courses, edit catalogue details, and manage module videos.</div>
        </div>
        <button className="ks-btn ks-btn-gold" onClick={() => setEditingId("__new")}><Plus size={15} /> New course</button>
      </div>

      <div className="ks-card" style={{ padding: 0, overflow: "hidden" }}>
        {courses.map((c, i) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < courses.length - 1 ? "1px solid var(--line)" : "none" }}>
            <CategoryDot color={c.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title || "(untitled course)"}</div>
              <div style={{ fontSize: 12.5, color: "var(--slate-light)" }}>{c.provider} · {c.modules} modules · {c.hours}h</div>
            </div>
            <button className="ks-btn ks-btn-ghost" onClick={() => setEditingId(c.id)}><Pencil size={14} /> Edit</button>
          </div>
        ))}
        {courses.length === 0 && (
          <div style={{ padding: 24, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>No courses yet — add your first one.</div>
        )}
      </div>
    </div>
  );
}

function TrainerCourseEditor({ course, onCancel, onSave, nextId }) {
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

/* ---------- Root ---------- */

export default function KeystonePrototype() {
  const [screen, setScreen] = useState("home");
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(ENROLLED_DEFAULT);
  const [learningCourse, setLearningCourse] = useState(null);
  const [toast, setToast] = useState(null);
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"
  const [pendingCourse, setPendingCourse] = useState(null);
  // NEW: course catalogue is now state (seeded from INITIAL_COURSES) instead
  // of a static module-level constant, so trainer adds/edits re-render every
  // learner-facing screen that reads it.
  const [courses, setCourses] = useState(INITIAL_COURSES);
  // NEW: role flag gating the Trainer studio. Set from the AuthModal signup
  // form's role toggle; see AppSidebar's demo switch for the prototype-only
  // convenience of flipping it without a second account.
  const [role, setRole] = useState("learner");

  useEffect(() => {
    const titles = {
      home: "Keystone Learning",
      catalogue: "Catalogue — Keystone",
      dashboard: "My Learning — Keystone",
      learning: learningCourse ? `${learningCourse.title} — Keystone` : "Keystone",
      trainer: "Trainer Studio — Keystone",
    };
    document.title = titles[screen] || "Keystone";
  }, [screen, learningCourse]);

  const enrolledIds = enrolled.map((e) => e.courseId);

  function saveCourse(draft) {
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === draft.id);
      return exists ? prev.map((c) => (c.id === draft.id ? draft : c)) : [...prev, draft];
    });
    setToast(`Saved "${draft.title}"`);
    setTimeout(() => setToast(null), 2600);
  }

  function goTo(key) {
    setScreen(key);
  }
  function openAuth(mode) {
    setAuthMode(mode);
  }
  function completeEnrol(course) {
    if (!enrolledIds.includes(course.id)) {
      setEnrolled((prev) => [...prev, { courseId: course.id, progress: 0, status: "in-progress", lastAccessed: "just now" }]);
      setToast(`Enrolled in "${course.title}"`);
      setTimeout(() => setToast(null), 2600);
    }
    setSelectedCourse(null);
    setScreen("dashboard");
  }
  function handleAuthSubmit(mode, formData) {
    setLoggedIn(true);
    setAuthMode(null);
    // ASSUMPTION: role only comes from the signup form (formData.role); a
    // login has no role field in this mock system, so it leaves whatever
    // role was last set (defaults to "learner"). A real backend would look
    // this up from the account instead.
    if (mode === "signup" && formData?.role) setRole(formData.role);
    if (pendingCourse) {
      completeEnrol(pendingCourse);
      setPendingCourse(null);
    } else {
      setScreen("dashboard");
    }
  }
  function handleEnrol(course) {
    if (!loggedIn) {
      setPendingCourse(course);
      setSelectedCourse(null);
      setAuthMode("signup");
      return;
    }
    completeEnrol(course);
  }
  function handleStartLearning(course) {
    setLearningCourse(course);
    setScreen("learning");
  }

  const showSidebar = loggedIn && (screen === "dashboard" || screen === "learning" || screen === "catalogue" || screen === "trainer");

  return (
    <div className="ks-root">
      <div style={{ display: "flex", minHeight: 640 }}>
        {showSidebar && (
          <AppSidebar screen={screen} onGo={goTo} role={role}
            onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {showSidebar && (
            <AppTopbar title={
              screen === "dashboard" ? "My learning" :
              screen === "catalogue" ? "Catalogue" :
              screen === "learning" ? learningCourse?.title :
              screen === "trainer" ? "Trainer studio" : ""
            } />
          )}

          {screen === "home" && <HomeScreen onGo={goTo} onAuth={openAuth} courses={courses} />}
          {screen === "catalogue" && (
            <CatalogueScreen loggedIn={loggedIn} onGo={goTo} onAuth={openAuth}
              onOpenCourse={setSelectedCourse} enrolledIds={enrolledIds} courses={courses} />
          )}
          {screen === "dashboard" && (
            <DashboardScreen enrolled={enrolled} onOpenCourse={setSelectedCourse} onStartLearning={handleStartLearning} courses={courses} />
          )}
          {screen === "learning" && <LearningScreen course={learningCourse} onBack={() => goTo("dashboard")} />}
          {screen === "trainer" && role === "trainer" && (
            <TrainerScreen courses={courses} onSaveCourse={saveCourse} />
          )}
        </div>
      </div>

      <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)}
        onEnrol={handleEnrol} isEnrolled={selectedCourse ? enrolledIds.includes(selectedCourse.id) : false} />

      <AuthModal mode={authMode} onClose={() => { setAuthMode(null); setPendingCourse(null); }} onSubmit={handleAuthSubmit} />

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--paper)", padding: "12px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, zIndex: 60 }}>
          <CheckCircle2 size={16} color="var(--gold)" /> {toast}
        </div>
      )}
    </div>
  );
}
