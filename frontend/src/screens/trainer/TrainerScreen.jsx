import { useState, useEffect } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

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

  // #185 — search-by-title + ownership filter for the course list,
  // matching Catalogue's search/chip pattern. Ownership rather than
  // category: "mine" vs. "view only" is the split that already exists
  // per-row (via canEditCourse below) and is the one that actually
  // matters when a trainer is hunting for a course to edit, so it's the
  // more useful chip set for this screen specifically.
  const [courseSearch, setCourseSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("All"); // "All" | "Mine" | "View only"

  // #155 — need the trainer's own providerId to mirror
  // RequireCourseOwnerGuard's "shared provider member" branch client-side.
  // Fetched once on mount, same cancelled-flag pattern as
  // TrainerCourseEditor's onFetchProvider/onFetchProfile effect —
  // onFetchProfile is recreated every App.jsx render, so it's deliberately
  // left out of the dependency array.
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    onFetchProfile().then((profile) => {
      if (!cancelled) setMyProfile(profile);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // #155 — mirrors RequireCourseOwnerGuard exactly: a NULL ownerId is a
  // legacy/pre-ownership course, exempted (editable by any trainer);
  // otherwise the caller must be the owner, or share the course's
  // provider. Keeping this logic here means the buttons never claim a
  // course is editable when the server would actually reject the request
  // — until myProfile has loaded, the provider-sharing branch just can't
  // pass yet, so at worst a shared course's buttons appear a beat late,
  // never early.
  function canEditCourse(course) {
    if (course.ownerId == null) return true;
    if (course.ownerId === currentUserId) return true;
    if (course.providerId && myProfile?.providerId === course.providerId) {
      return true;
    }
    return false;
  }

  const byOwnership =
    ownerFilter === "All"
      ? courses
      : courses.filter((c) => (ownerFilter === "Mine" ? canEditCourse(c) : !canEditCourse(c)));
  const query = courseSearch.trim().toLowerCase();
  const filteredCourses = query
    ? byOwnership.filter((c) => (c.title || "").toLowerCase().includes(query))
    : byOwnership;

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
    <div className="ks-page-enter" style={{ padding: "28px 32px", maxWidth: 1080 }}>
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

      {/* #105 — key={tab} remounts this wrapper on tab switch, replaying
          the ks-tab-panel fade defined in global.css. */}
      <div key={tab} className="ks-tab-panel">
      {tab === "courses" && (
        <>
          {/* #185 — search by title + ownership filter, same visual
              pattern as Catalogue's search/chip row. */}
          <div className="flex flex-col items-stretch md:flex-row md:items-center" style={{ gap: 14, marginBottom: 14 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
              <Search size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 11 }} />
              <input
                className="ks-input"
                placeholder="Search by title"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", "Mine", "View only"].map((o) => (
                <span
                  key={o}
                  onClick={() => setOwnerFilter(o)}
                  style={{
                    fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 100, cursor: "pointer",
                    background: ownerFilter === o ? "var(--ink)" : "var(--paper-2)", color: ownerFilter === o ? "var(--paper)" : "var(--slate)",
                    border: "1px solid var(--line)",
                  }}
                >
                  {o}
                </span>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <button className="ks-btn ks-btn-gold" onClick={() => setEditingId("__new")}><Plus size={15} /> New course</button>
          </div>

          <div className="ks-card" style={{ padding: 0, overflow: "hidden" }}>
            {filteredCourses.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < filteredCourses.length - 1 ? "1px solid var(--line)" : "none" }}>
                <CategoryDot color={c.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title || "(untitled course)"}</div>
                  <div style={{ fontSize: 12.5, color: "var(--slate-light)" }}>{c.provider} · {c.modules.length} modules · {c.hours}h</div>
                </div>
                {canEditCourse(c) ? (
                  <>
                    <button className="ks-btn ks-btn-ghost" onClick={() => setEditingId(c.id)}><Pencil size={14} /> Edit</button>
                    <button
                      className="ks-btn ks-btn-ghost"
                      style={{ color: "var(--coral)" }}
                      onClick={() => { setDeletingCourse(c); setDeleteError(null); }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                ) : (
                  // #155 — not this trainer's course (no ownerId/providerId
                  // match): no Edit/Delete, and deliberately no click-through
                  // to the editor either, since that's what was exposing full
                  // course details for courses CRUD would reject anyway.
                  <span style={{ fontSize: 12, color: "var(--slate-light)" }}>View only</span>
                )}
              </div>
            ))}
            {filteredCourses.length === 0 && (
              <div style={{ padding: 24, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
                {courses.length === 0
                  ? "No courses yet — add your first one."
                  : query
                    ? `No courses match "${courseSearch.trim()}".`
                    : "No courses match this filter."}
              </div>
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
      </div>

      {deletingCourse && (
        <div
          onClick={() => !deleting && setDeletingCourse(null)}
          className="ks-modal-backdrop"
          style={{ position: "fixed", inset: 0, background: "#16233Db3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="ks-card ks-modal-card" style={{ width: "100%", maxWidth: 400, padding: "24px 26px" }}>
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