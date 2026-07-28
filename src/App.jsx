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
import { DashboardScreen } from "./screens/DashboardScreen";
import { LearningScreen } from "./screens/LearningScreen";
import { TrainerScreen } from "./screens/trainer/TrainerScreen";

/* ---------------------------------------------------------------
   KEYSTONE LEARNING — clickable prototype
--------------------------------------------------------------- */

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
