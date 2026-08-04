import React, { useState, useEffect } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation
} from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

// NOTE: INITIAL_COURSES import removed — course data now comes from the
// NestJS backend instead of this local mock file. ENROLLED_DEFAULT is
// untouched for now (enrolment/user data isn't backed by the API yet).
import { ENROLLED_DEFAULT } from "./data/courses";

import { MarketingHeader } from "./components/layout/MarketingHeader";
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

/* ---------- Layout shell (sidebar + topbar) for logged-in app routes ---------- */
function AppShell({ loggedIn, role, onSwitchRole, onLogout, title, children }) {
  const location = useLocation();
  const screen = screenKeyFromPath(location.pathname);
  const navigate = useNavigate();

  const showSidebar = loggedIn;

  return (
    <div style={{ display: "flex", minHeight: 640 }}>
      {showSidebar && (
        <AppSidebar
          screen={screen}
          onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)}
          role={role}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
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
function LearningRoute({ courses }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courses.find((c) => String(c.id) === courseId);

  if (!course) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LearningScreen course={course} onBack={() => navigate("/dashboard")} />;
}

/* ---------- Root ---------- */
function KeystonePrototype() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState("learner");
  const [authLoading, setAuthLoading] = useState(true); // checking for an existing session on load
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(ENROLLED_DEFAULT);
  const [toast, setToast] = useState(null);
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"
  const [pendingCourse, setPendingCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);

  // On load: check for an existing Supabase session (e.g. after a page
  // refresh), and stay subscribed to auth state changes (login, logout,
  // token refresh) for as long as the app is open.
  useEffect(() => {
    function applySession(session) {
      if (session) {
        setLoggedIn(true);
        setRole(session.user.user_metadata?.role || "learner");
      } else {
        setLoggedIn(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/courses`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setCourses(data))
      .catch((err) => setCoursesError(err.message))
      .finally(() => setCoursesLoading(false));
  }, []);

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
      headers: { "Content-Type": "application/json" },
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

  function openAuth(mode) {
    setAuthMode(mode);
  }

  function completeEnrol(course) {
    if (!enrolledIds.includes(course.id)) {
      setEnrolled((prev) => [
        ...prev,
        { courseId: course.id, progress: 0, status: "in-progress", lastAccessed: "just now" },
      ]);
      setToast(`Enrolled in "${course.title}"`);
      setTimeout(() => setToast(null), 2600);
    }
    setSelectedCourse(null);
    navigate("/dashboard");
  }

  // AuthModal now performs the real Supabase call itself and hands us the
  // resulting session directly, replacing the old (mode, formData) shape.
  function handleAuthSubmit(session) {
    setLoggedIn(true);
    setRole(session.user.user_metadata?.role || "learner");
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
    setLoggedIn(false);
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
              <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} onLogout={handleLogout} title="Home">
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
            <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} onLogout={handleLogout} title={shellTitle}>
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
              <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} onLogout={handleLogout} title={shellTitle}>
                <DashboardScreen
                  enrolled={enrolled}
                  onOpenCourse={setSelectedCourse}
                  onStartLearning={handleStartLearning}
                  courses={courses}
                />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/learning/:courseId"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} onLogout={handleLogout} title={shellTitle}>
                <LearningRoute courses={courses} />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/trainer"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <RequireTrainer role={role}>
                <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} onLogout={handleLogout} title={shellTitle}>
                  <TrainerScreen courses={courses} onSaveCourse={saveCourse} />
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