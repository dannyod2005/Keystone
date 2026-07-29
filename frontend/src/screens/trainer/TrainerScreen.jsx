import { useState } from "react";
import { Pencil, Plus } from "lucide-react";

import { CategoryDot } from "../../components/common/Primitives";
import { TrainerCourseEditor } from "./TrainerCourseEditor";

function nextCourseId(courses) {
  // Build the set of taken ids once, up front. The while loop below then
  // only ever checks membership against this fixed Set — no function is
  // declared inside the loop, so there's nothing for no-loop-func to flag,
  // and it's O(n) instead of re-scanning the whole courses array on every
  // candidate id.
  const existingIds = new Set(courses.map((c) => c.id));

  let n = courses.length + 1;
  let id = `c${n}`;
  while (existingIds.has(id)) {
    n += 1;
    id = `c${n}`;
  }
  return id;
}

export function TrainerScreen({ courses, onSaveCourse }) {
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