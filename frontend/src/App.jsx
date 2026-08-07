import React, { useState, useEffect } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation
} from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { useAuth } from "./context/AuthContext";

import { AppSidebar } from "./components/layout/AppSidebar";
import { AppTopbar } from "./components/layout/AppTopbar";

import { CourseDetailModal } from "./components/modals/CourseDetailModal";
import { AuthModal } from "./components/modals/AuthModal";

import { HomeScreen } from "./screens/HomeScreen";
import { CatalogueScreen } from "./screens/CatalogueScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { LearningScreen } from "./screens/LearningScreen";
import { TrainerScreen } from "./screens/trainer/TrainerScreen";

/* ---------------------------------------------------------------
   KEYSTONE LEARNING — clickable prototype (now routed)
--------------------------------------------------------------- */

function screenKeyFromPath(pathname) {
  if (pathname.startsWith("/catalogue")) return "catalogue";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/learning")) return "learning";
  if (pathname.startsWith("/trainer")) return "trainer";
  return "home";
}

// Backend returns lastAccessed as an ISO timestamp or null (a fresh
// enrollment has never been "accessed" yet). Format to something short
// for display; DashboardScreen just interpolates this string raw.
function formatLastAccessed(iso) {
  if (!iso) return "not yet";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- Layout shell (sidebar + topbar) for logged-in app routes ---------- */
function AppShell({ loggedIn, role, onLogout, title, children, user }) {
  const location = useLocation();
  const screen = screenKeyFromPath(location.pathname);
  const navigate = useNavigate();

  const showSidebar = loggedIn;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {showSidebar && (
        <AppSidebar
          screen={screen}
          onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)}
          role={role}
          onLogout={onLogout}
          user={user}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {showSidebar && <AppTopbar title={title} />}
        {children}
      </div>
    </div>
  );
}

/* ---------- Route guards ---------- */
function RequireAuth({ loggedIn, children }) {
  const location = useLocation();
  if (!loggedIn) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireTrainer({ role, children }) {
  if (role !== "trainer") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/* ---------- Learning screen wrapper: resolves :courseId -> course object ---------- */
function LearningRoute({ courses, enrolled, onSaveProgress, onFetchQuiz, onSubmitQuiz, onFetchNote, onSaveNote, onFetchPosts, onCreatePost, onEditPost, currentUserId }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courses.find((c) => String(c.id) === courseId);
  const enrollment = enrolled.find((e) => e.courseId === courseId);

  if (!course) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <LearningScreen
      course={course}
      enrollment={enrollment}
      onSaveProgress={onSaveProgress}
      onFetchQuiz={onFetchQuiz}
      onSubmitQuiz={onSubmitQuiz}
      onFetchNote={onFetchNote}
      onSaveNote={onSaveNote}
      onFetchPosts={onFetchPosts}
      onCreatePost={onCreatePost}
      onEditPost={onEditPost}
      currentUserId={currentUserId}
      onBack={() => navigate("/dashboard")}
    />
  );
}

/* ---------- Root ---------- */
function KeystonePrototype() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, session, loading: authLoading } = useAuth();
  const loggedIn = !!user;
  const role = user?.user_metadata?.role || "learner";

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [toast, setToast] = useState(null);
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"
  const [pendingCourse, setPendingCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activitySummary, setActivitySummary] = useState({
    streak: 0,
    minutesThisWeek: 0,
    dailyGoalMin: 30,
    goalHitDays: 0,
    week: [],
  });

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/courses`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setCourses(data))
      .catch((err) => console.error("Failed to load courses:", err.message));
  }, []);
  // Fetch the logged-in user's real enrollments (#19), replacing the old
  // ENROLLED_DEFAULT mock. Re-runs whenever login state changes; clears
  // back to [] on logout rather than leaving stale data from a previous
  // session visible.
  useEffect(() => {
    if (!loggedIn || !session) {
      setEnrolled([]);
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/enrollments`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // progress arrives as a string (Postgres decimal via pg driver,
        // same quirk seen with Course.rating) — convert once here so
        // DashboardScreen's arithmetic (e.progress * 100, etc.) works
        // without needing changes there.
        setEnrolled(
          data.map((e) => ({
            ...e,
            progress: Number(e.progress),
            lastAccessed: formatLastAccessed(e.lastAccessed),
          })),
        );
      })
      .catch((err) => {
        console.error("Failed to load enrollments:", err.message);
        setEnrolled([]);
      });
  }, [loggedIn, session]);

  // Real streak / minutes-this-week / daily-goal data (#37), replacing the
  // old LEARNER mock. Re-runs on login state change like enrollments above;
  // resets to a neutral empty shape on logout.
  useEffect(() => {
    if (!loggedIn || !session) {
      setActivitySummary({
        streak: 0,
        minutesThisWeek: 0,
        dailyGoalMin: 30,
        goalHitDays: 0,
        week: [],
      });
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/activity/summary`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then(setActivitySummary)
      .catch((err) => console.error("Failed to load activity summary:", err.message));
  }, [loggedIn, session]);

  // Fire-and-forget refresh after an action that logs activity server-side
  // (module completed, quiz submitted, note saved, forum post made) — so
  // the dashboard reflects it without needing a full reload. A failure
  // here shouldn't surface to the user; it just means the dashboard stays
  // slightly stale until the next natural refetch.
  async function refetchActivitySummary() {
    if (!session) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/activity/summary`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      setActivitySummary(await res.json());
    } catch (err) {
      console.error("Failed to refresh activity summary:", err.message);
    }
  }

  const screen = screenKeyFromPath(location.pathname);

  useEffect(() => {
    const learningCourse =
      screen === "learning" ? courses.find((c) => `/learning/${c.id}` === location.pathname) : null;
    const titles = {
      home: "Keystone Learning",
      catalogue: "Catalogue — Keystone",
      dashboard: "My Learning — Keystone",
      learning: learningCourse ? `${learningCourse.title} — Keystone` : "Keystone",
      trainer: "Trainer Studio — Keystone",
    };
    document.title = titles[screen] || "Keystone";
  }, [screen, location.pathname, courses]);

  const enrolledIds = enrolled.map((e) => e.courseId);

  async function saveCourse(draft) {
    const isNew = !draft.id;
    const url = isNew
      ? `${process.env.REACT_APP_API_URL}/courses`
      : `${process.env.REACT_APP_API_URL}/courses/${draft.id}`;

    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(draft.payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message || `Request failed: ${res.status}`;
      throw new Error(message);
    }

    const saved = await res.json();

    setCourses((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved];
    });
    setToast(`Saved "${saved.title}"`);
    setTimeout(() => setToast(null), 2600);
    return saved;
  }

  async function saveProgress(enrollmentId, completedModules) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/enrollments/${enrollmentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ completedModules }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    const updated = await res.json();
    setEnrolled((prev) =>
      prev.map((e) =>
        e.id === updated.id
          ? { ...updated, progress: Number(updated.progress), lastAccessed: formatLastAccessed(updated.lastAccessed) }
          : e,
      ),
    );
    refetchActivitySummary();
  }

  async function fetchNote(moduleId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/notes`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async function saveNote(moduleId, content) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/notes`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    const result = await res.json();
    refetchActivitySummary();
    return result;
  }

  function openAuth(mode) {
    setAuthMode(mode);
  }

  async function refetchEnrollments() {
    if (!session) return;
    const res = await fetch(`${process.env.REACT_APP_API_URL}/enrollments`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setEnrolled(
      data.map((e) => ({
        ...e,
        progress: Number(e.progress),
        lastAccessed: formatLastAccessed(e.lastAccessed),
      })),
    );
  }

  async function completeEnrol(course) {
    if (enrolledIds.includes(course.id)) {
      setSelectedCourse(null);
      navigate("/dashboard");
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/enrollments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ courseId: course.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Request failed: ${res.status}`);
      }

      await refetchEnrollments();
      setToast(`Enrolled in "${course.title}"`);
      setTimeout(() => setToast(null), 2600);
    } catch (err) {
      setToast(`Couldn't enrol: ${err.message}`);
      setTimeout(() => setToast(null), 3200);
    }

    setSelectedCourse(null);
    navigate("/dashboard");
  }

  async function fetchQuiz(moduleId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/quiz`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async function submitQuiz(moduleId, answers) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/quiz/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ answers }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    const result = await res.json();
    refetchActivitySummary();
    return result;
  }

  async function fetchPosts(moduleId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/forum`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async function createPost(moduleId, content, parentPostId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/forum`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      // parentPostId omitted entirely (not sent as null) when this is a
      // top-level post — the backend DTO's @IsOptional() only skips
      // validation for a genuinely missing key, not an explicit null.
      body: JSON.stringify(parentPostId ? { content, parentPostId } : { content }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    const result = await res.json();
    refetchActivitySummary();
    return result;
  }

  async function editPost(moduleId, postId, content) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/forum/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    // No activity refetch here — editing isn't new activity, deliberately
    // (an unlimited edit loop shouldn't be a way to farm streak minutes).
    return res.json();
  }

  async function fetchQuizForEdit(moduleId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/quiz/edit`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async function saveQuiz(moduleId, payload) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/quiz`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message || `Request failed: ${res.status}`;
      throw new Error(message);
    }

    return res.json();
  }

  function handleAuthSubmit(session) {
    setAuthMode(null);
    if (pendingCourse) {
      completeEnrol(pendingCourse);
      setPendingCourse(null);
    } else {
      navigate("/dashboard");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
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
    navigate(`/learning/${course.id}`);
  }

  async function viewCertificate(enrollmentId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/enrollments/${enrollmentId}/certificate`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    // Revoke after a delay rather than immediately — the new tab needs
    // time to actually load the blob URL before it's invalidated.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }

  const shellTitle =
    screen === "dashboard" ? "My learning" :
    screen === "catalogue" ? "Catalogue" :
    screen === "learning" ? (courses.find((c) => `/learning/${c.id}` === location.pathname)?.title ?? "") :
    screen === "trainer" ? "Trainer studio" : "";

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontSize: 13, color: "var(--slate-light)" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="ks-root">
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title="Home" user={user}>
                <HomeScreen onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)} onAuth={openAuth} courses={courses} loggedIn={loggedIn} />
              </AppShell>
            ) : (
              <HomeScreen onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)} onAuth={openAuth} courses={courses} loggedIn={loggedIn} />
            )
          }
        />

        <Route
          path="/catalogue"
          element={
            <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title={shellTitle} user={user}>
              <CatalogueScreen
                loggedIn={loggedIn}
                onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)}
                onAuth={openAuth}
                onOpenCourse={setSelectedCourse}
                enrolledIds={enrolledIds}
                courses={courses}
              />
            </AppShell>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title={shellTitle} user={user}>
                <DashboardScreen
                  enrolled={enrolled}
                  onOpenCourse={setSelectedCourse}
                  onStartLearning={handleStartLearning}
                  courses={courses}
                  onViewCertificate={viewCertificate}
                  user={user}
                  activitySummary={activitySummary}
                />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/learning/:courseId"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title={shellTitle} user={user}>
                <LearningRoute
                  courses={courses}
                  enrolled={enrolled}
                  onSaveProgress={saveProgress}
                  onFetchQuiz={fetchQuiz}
                  onSubmitQuiz={submitQuiz}
                  onFetchNote={fetchNote}
                  onSaveNote={saveNote}
                  onFetchPosts={fetchPosts}
                  onCreatePost={createPost}
                  onEditPost={editPost}
                  currentUserId={user?.id}
                />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/trainer"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <RequireTrainer role={role}>
                <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title={shellTitle} user={user}>
                  <TrainerScreen
                    courses={courses}
                    onSaveCourse={saveCourse}
                    onFetchQuizForEdit={fetchQuizForEdit}
                    onSaveQuiz={saveQuiz}
                  />
                </AppShell>
              </RequireTrainer>
            </RequireAuth>
          }
        />

        {/* Fallback: unknown paths go home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CourseDetailModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onEnrol={handleEnrol}
        onGoToDashboard={() => { setSelectedCourse(null); navigate("/dashboard"); }}
        isEnrolled={selectedCourse ? enrolledIds.includes(selectedCourse.id) : false}
      />

      <AuthModal
        mode={authMode}
        onClose={() => { setAuthMode(null); setPendingCourse(null); }}
        onSubmit={handleAuthSubmit}
      />

      {toast && (
        <div
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            background: "var(--ink)", color: "var(--paper)", padding: "12px 20px",
            borderRadius: 10, fontSize: 13.5, fontWeight: 500, display: "flex",
            alignItems: "center", gap: 8, zIndex: 60,
          }}
        >
          <CheckCircle2 size={16} color="var(--gold)" /> {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- Default export: wraps in BrowserRouter ---------- */
export default function App() {
  return (
    <BrowserRouter>
      <KeystonePrototype />
    </BrowserRouter>
  );
}