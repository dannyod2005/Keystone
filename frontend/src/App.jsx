import React, { useState, useEffect } from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation
} from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

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

// Maps a pathname to the "screen key" the sidebar/topbar expect,
// so AppSidebar/AppTopbar don't need to know about router internals.
function screenKeyFromPath(pathname) {
  if (pathname.startsWith("/catalogue")) return "catalogue";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/learning")) return "learning";
  if (pathname.startsWith("/trainer")) return "trainer";
  return "home";
}

/* ---------- Layout shell (sidebar + topbar) for logged-in app routes ---------- */
function AppShell({ loggedIn, role, onSwitchRole, title, children }) {
  const location = useLocation();
  const screen = screenKeyFromPath(location.pathname);
  const navigate = useNavigate();

  const showSidebar = loggedIn; // home never renders AppShell at all (see routes below)

  return (
    <div style={{ display: "flex", minHeight: 640 }}>
      {showSidebar && (
        <AppSidebar
          screen={screen}
          onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)}
          role={role}
          onSwitchRole={onSwitchRole}
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
    // Bounce unauthenticated visitors back to the marketing home page,
    // remembering where they were headed in case you want to resume
    // after login later.
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
    // Unknown/removed course id — send them back to their dashboard
    // instead of rendering a blank learning screen.
    return <Navigate to="/dashboard" replace />;
  }
  return <LearningScreen course={course} onBack={() => navigate("/dashboard")} />;
}

/* ---------- Root ---------- */
function KeystonePrototype() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(ENROLLED_DEFAULT);
  const [toast, setToast] = useState(null);
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"
  const [pendingCourse, setPendingCourse] = useState(null);
  // Starts empty rather than seeded with mock data — real courses arrive
  // asynchronously from the backend once the fetch below completes.
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [role, setRole] = useState("learner");

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

  function saveCourse(draft) {
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === draft.id);
      return exists ? prev.map((c) => (c.id === draft.id ? draft : c)) : [...prev, draft];
    });
    setToast(`Saved "${draft.title}"`);
    setTimeout(() => setToast(null), 2600);
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
      navigate("/dashboard");
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
    navigate(`/learning/${course.id}`);
  }

  const shellTitle =
    screen === "dashboard" ? "My learning" :
    screen === "catalogue" ? "Catalogue" :
    screen === "learning" ? (courses.find((c) => `/learning/${c.id}` === location.pathname)?.title ?? "") :
    screen === "trainer" ? "Trainer studio" : "";

  return (
    <div className="ks-root">
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} title="Home">
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
            <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} title={shellTitle}>
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
              <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} title={shellTitle}>
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
              <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} title={shellTitle}>
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
                <AppShell loggedIn={loggedIn} role={role} onSwitchRole={() => setRole((r) => (r === "trainer" ? "learner" : "trainer"))} title={shellTitle}>
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