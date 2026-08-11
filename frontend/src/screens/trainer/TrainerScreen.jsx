import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { CategoryDot } from "../../components/common/Primitives";
import { TrainerCourseEditor } from "./TrainerCourseEditor";
import { TeamTab } from "./TeamTab";

export function TrainerScreen({
  courses,
  onSaveCourse,
  onDeleteCourse,
  onFetchQuizForEdit,
  onSaveQuiz,
  onFetchProvider,
  onFetchProfile,
  onCreateProvider,
  onJoinProvider,
  onRegenerateInviteCode,
  onLeaveProvider,
  currentUserId,
}) {
  const [editingId, setEditingId] = useState(null); // null = list view, "__new" = creating, else course id
  const [deletingCourse, setDeletingCourse] = useState(null); // course pending delete confirmation, or null
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // #139 — "Courses" (existing list/editor flow, untouched) vs "Team"
  // (provider create/join/manage). Deliberately a separate tab rather than
  // anything on the course form itself — provider scoping stays an opt-in
  // upgrade managed from here, never a gate on creating a course.
  const [tab, setTab] = useState("courses");

  const editingCourse =
    editingId === "__new" ? null :
    editingId ? courses.find((c) => c.id === editingId) : null;

  async function handleSave(draft) {
    await onSaveCourse(draft); // throws on failure — editor catches and shows the error
    setEditingId(null);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteCourse(deletingCourse.id);
      setDeletingCourse(null);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete course.");
    } finally {
      setDeleting(false);
    }
  }

  if (editingId) {
    return (
      <TrainerCourseEditor
        course={editingCourse}
        onCancel={() => setEditingId(null)}
        onSave={handleSave}
        onFetchQuizForEdit={onFetchQuizForEdit}
        onSaveQuiz={onSaveQuiz}
        onFetchProvider={onFetchProvider}
        onFetchProfile={onFetchProfile}
      />
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1080 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Trainer studio</div>
        <div style={{ fontSize: 13, color: "var(--slate)", marginTop: 2 }}>
          {tab === "courses"
            ? "Add courses, edit catalogue details, and manage module videos."
            : "Create or join a provider to share course edit access with your team."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, borderBottom: "1px solid var(--line)", marginBottom: 20 }}>
        <div className={`ks-tab ${tab === "courses" ? "active" : ""}`} onClick={() => setTab("courses")}>Courses</div>
        <div className={`ks-tab ${tab === "team" ? "active" : ""}`} onClick={() => setTab("team")}>Team</div>
      </div>

      {tab === "courses" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="ks-btn ks-btn-gold" onClick={() => setEditingId("__new")}><Plus size={15} /> New course</button>
          </div>

          <div className="ks-card" style={{ padding: 0, overflow: "hidden" }}>
            {courses.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < courses.length - 1 ? "1px solid var(--line)" : "none" }}>
                <CategoryDot color={c.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title || "(untitled course)"}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)" }}>{c.provider} · {c.modules.length} modules · {c.hours}h</div>
                </div>
                <button className="ks-btn ks-btn-ghost" onClick={() => setEditingId(c.id)}><Pencil size={14} /> Edit</button>
                <button
                  className="ks-btn ks-btn-ghost"
                  style={{ color: "var(--coral)" }}
                  onClick={() => { setDeletingCourse(c); setDeleteError(null); }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            ))}
            {courses.length === 0 && (
              <div style={{ padding: 24, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>No courses yet — add your first one.</div>
            )}
          </div>
        </>
      )}

      {tab === "team" && (
        <TeamTab
          onFetchProvider={onFetchProvider}
          onCreateProvider={onCreateProvider}
          onJoinProvider={onJoinProvider}
          onRegenerateInviteCode={onRegenerateInviteCode}
          onLeaveProvider={onLeaveProvider}
          currentUserId={currentUserId}
        />
      )}

      {deletingCourse && (
        <div
          onClick={() => !deleting && setDeletingCourse(null)}
          style={{ position: "fixed", inset: 0, background: "#16233Db3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="ks-card" style={{ width: "100%", maxWidth: 400, padding: "24px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>Delete course?</div>
              <X size={18} color="var(--slate)" style={{ cursor: "pointer" }} onClick={() => !deleting && setDeletingCourse(null)} />
            </div>
            <div style={{ fontSize: 13.5, color: "var(--slate)", lineHeight: 1.5, marginBottom: 20 }}>
              This removes <strong>{deletingCourse.title || "(untitled course)"}</strong> from the catalogue. Learners already enrolled keep their progress and access — this can't be undone from the catalogue side, so double-check before continuing.
            </div>
            {deleteError && (
              <div style={{ fontSize: 12.5, color: "var(--coral)", marginBottom: 14 }}>{deleteError}</div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="ks-btn ks-btn-ghost" disabled={deleting} onClick={() => setDeletingCourse(null)}>Cancel</button>
              <button
                className="ks-btn"
                style={{ background: "var(--coral)", color: "#fff", opacity: deleting ? 0.7 : 1 }}
                disabled={deleting}
                onClick={handleConfirmDelete}
              >
                {deleting ? "Deleting…" : "Delete course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}