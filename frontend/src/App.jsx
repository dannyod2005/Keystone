import React, { useState, useEffect, useMemo } from "react";
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
import { GoalOnboardingModal } from "./components/modals/GoalOnboardingModal";
import { RoleOnboardingModal } from "./components/modals/RoleOnboardingModal";
import { ResetPasswordModal } from "./components/modals/ResetPasswordModal";

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

// #110 — Course.rating is a Postgres decimal column, which the pg driver
// (via TypeORM, no transformer defined) returns as a string, not a
// number — same quirk as Enrollment.progress (see the comment where
// enrolled state is set below). Every current frontend usage of rating
// happens to tolerate a string (Math.round auto-coerces, plain JSX
// display doesn't care about type), so nothing was visibly broken, but
// that's incidental, not a guarantee — same "parse once at the API
// boundary" fix applied here for consistency with progress, so
// course.rating is an actual number everywhere downstream from here.
function normalizeCourse(c) {
  return { ...c, rating: c.rating == null ? null : Number(c.rating) };
}

/* ---------- Layout shell (sidebar + topbar) for logged-in app routes ---------- */
function AppShell({ loggedIn, role, onLogout, title, children, user, goal }) {
  const location = useLocation();
  const screen = screenKeyFromPath(location.pathname);
  const navigate = useNavigate();

  const showSidebar = loggedIn;

  // #104 — the sidebar is always in the DOM (needed so it can slide in/out
  // on mobile rather than mount/unmount), just off-canvas by default below
  // the md breakpoint. This state only controls that mobile open/closed
  // state; on md+ the sidebar ignores it entirely (see AppSidebar).
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function go(key) {
    setMobileNavOpen(false);
    navigate(key === "home" ? "/" : `/${key}`);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {showSidebar && (
        <AppSidebar
          screen={screen}
          onGo={go}
          role={role}
          onLogout={onLogout}
          user={user}
          goal={goal}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {showSidebar && <AppTopbar title={title} onMenuClick={() => setMobileNavOpen(true)} />}
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
function LearningRoute({ courses, enrolled, coursesLoading, enrolledLoading, onSaveProgress, onSubmitRating, onLogModuleView, onFetchQuiz, onSubmitQuiz, onFetchQuizResults, onFetchNote, onSaveNote, onFetchPosts, onCreatePost, onEditPost, currentUserId }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courses.find((c) => String(c.id) === courseId);
  const enrollment = enrolled.find((e) => e.courseId === courseId);

  // #181 — `courses` (the public catalogue fetch) and `enrolled` (needed
  // both for the enrollment lookup below and, via `coursesForLearners`,
  // for courses a learner is enrolled in that have since left the public
  // catalogue) are both still empty on a fresh page load — a hard reload
  // or direct navigation to this URL — until their fetches resolve. A
  // "not found" redirect here can't be trusted until both have actually
  // loaded; earlier this fired on that empty-array startup state instead
  // of waiting, bouncing straight to /dashboard before the real data ever
  // arrived. Show a loading state instead, and only redirect once loading
  // is done and the course still genuinely isn't found.
  if (!course) {
    if (coursesLoading || enrolledLoading) {
      return (
        <div className="ks-card" style={{ padding: 40, fontSize: 13.5, color: "var(--slate-light)", textAlign: "center" }}>
          Loading course…
        </div>
      );
    }
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <LearningScreen
      course={course}
      enrollment={enrollment}
      onSaveProgress={onSaveProgress}
      onSubmitRating={onSubmitRating}
      onLogModuleView={onLogModuleView}
      onFetchQuiz={onFetchQuiz}
      onSubmitQuiz={onSubmitQuiz}
      onFetchQuizResults={onFetchQuizResults}
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

  const { user, session, loading: authLoading, passwordRecovery, clearPasswordRecovery } = useAuth();
  const loggedIn = !!user;
  const role = user?.user_metadata?.role || "learner";

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [enrolling, setEnrolling] = useState(false); // #154 — the in-flight POST /enrollments request, so CourseDetailModal's Enrol button can disable/show pending state instead of allowing a double-click.
  const [toast, setToast] = useState(null);
  const [authMode, setAuthMode] = useState(null); // null | "login" | "signup"
  const [pendingCourse, setPendingCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [enrolledLoading, setEnrolledLoading] = useState(true);
  // #183 — which 7-day week the Dashboard's mini-calendar is showing,
  // in weeks relative to the current one (0 = this week, -1 = last
  // week, ...). Lives here rather than in DashboardScreen so it resets
  // naturally on logout along with the rest of this section's state.
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [activitySummary, setActivitySummary] = useState({
    streak: 0,
    minutesThisWeek: 0,
    dailyGoalMin: 30,
    goalHitDays: 0,
    week: [],
  });
  // #107 — profiles.goal: null until a learner picks one via the
  // onboarding modal below (or never, if they skip — that's a permanent,
  // fine end state, not a "loading" one). goalLoaded distinguishes "not
  // fetched yet" from "fetched, confirmed null" so the trigger effect below
  // never fires on a stale/pre-fetch value.
  const [learnerGoal, setLearnerGoal] = useState(null);
  const [goalLoaded, setGoalLoaded] = useState(false);
  const [showGoalOnboarding, setShowGoalOnboarding] = useState(false);
  // #186 — profiles.role, fetched alongside goal below (same /profiles/me
  // call). NULL only ever happens for a Google sign-up that hasn't picked
  // learner/trainer yet — see MakeProfileRoleNullable. Kept separate from
  // `role` (the user_metadata-derived value used for gating everywhere
  // else) since this one specifically tracks "what does the DB say right
  // now," which is what the trigger effect below needs to know.
  const [profileRole, setProfileRole] = useState(null);
  const [showRoleOnboarding, setShowRoleOnboarding] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/courses`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setCourses(data.map(normalizeCourse)))
      .catch((err) => console.error("Failed to load courses:", err.message))
      .finally(() => setCoursesLoading(false));
  }, []);
  // Fetch the logged-in user's real enrollments (#19), replacing the old
  // ENROLLED_DEFAULT mock. Re-runs whenever login state changes; clears
  // back to [] on logout rather than leaving stale data from a previous
  // session visible.
  useEffect(() => {
    if (!loggedIn || !session) {
      setEnrolled([]);
      setEnrolledLoading(false);
      return;
    }

    setEnrolledLoading(true);
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
      })
      .finally(() => setEnrolledLoading(false));
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
      setCalendarWeekOffset(0);
      return;
    }

    // #183 — weekOffset pages the calendar's day grid only; the backend
    // keeps streak/minutesThisWeek/goalHitDays pinned to the real
    // current week regardless, so those don't flicker as the calendar is
    // browsed.
    fetch(`${process.env.REACT_APP_API_URL}/activity/summary?weekOffset=${calendarWeekOffset}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then(setActivitySummary)
      .catch((err) => console.error("Failed to load activity summary:", err.message));
  }, [loggedIn, session, calendarWeekOffset]);

  // #107 — learner's goal (profiles.goal), replacing the old LEARNER.goal
  // mock. Same re-run/reset-on-logout pattern as activitySummary above.
  // A 404 here (shouldn't normally happen — handle_new_user() always
  // creates a profile row) is treated the same as "no goal set" rather
  // than surfaced as an error. goalLoaded only flips true once we actually
  // know the answer (a thrown/network error leaves it false, deliberately
  // — see the trigger effect below for why that matters), and resets to
  // false on logout so a stale "loaded" flag can't survive into a
  // different account's session.
  useEffect(() => {
    if (!loggedIn || !session) {
      setLearnerGoal(null);
      setGoalLoaded(false);
      setProfileRole(null);
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/profiles/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        setLearnerGoal(profile?.goal ?? null);
        setProfileRole(profile?.role ?? null);
        setGoalLoaded(true);
      })
      .catch((err) => console.error("Failed to load profile:", err.message));
  }, [loggedIn, session]);

  // #107 — shows the onboarding modal once conditions are actually known
  // to be true, rather than only right after a signup event: signing up
  // doesn't always yield an immediate session (Supabase's "confirm your
  // email" flow means the first real session for a lot of accounts is a
  // later *login*, not the signup itself), so gating this on a signup-only
  // callback silently never showed it for any account that had to confirm
  // its email first. Deriving it from "logged in and we've confirmed the
  // profile has no goal" instead fires correctly regardless of how that
  // session came about, and naturally covers pre-existing accounts (e.g.
  // the seeded demo learners) too. Only runs once per login — skipping
  // doesn't change any of this effect's dependencies, so it won't
  // re-trigger itself for the rest of the session; it'll offer again next
  // login/reload as long as goal is still unset.
  //
  // #189 — no longer gated on role === "learner". A trainer account can
  // enrol in and take courses just like a learner (Trainer Studio is an
  // additional capability layered on top, not a separate account type),
  // so they should get asked for a goal too — it only ever affects their
  // own learner-facing views (Catalogue/Dashboard), never Trainer Studio.
  // #186 — role must be resolved first: a fresh Google sign-up has both
  // role and goal null, and showing both onboarding modals at once would
  // stack two full-screen backdrops. Gating this on `profileRole !== null`
  // means it simply doesn't fire until the role effect below has run its
  // course (either role was already set — the normal email-signup case,
  // so this behaves exactly as before — or the learner/trainer picker just
  // resolved it), at which point goal onboarding proceeds same as always.
  useEffect(() => {
    if (loggedIn && goalLoaded && learnerGoal === null && profileRole !== null) {
      setShowGoalOnboarding(true);
    }
  }, [loggedIn, goalLoaded, learnerGoal, profileRole]);

  // #186 — mirrors the goal-onboarding trigger above: fires once we've
  // actually confirmed (via the /profiles/me fetch) that this account has
  // no role yet, rather than off a signup-specific callback — same
  // reasoning as #107's comment above, and it covers the Google OAuth
  // redirect-return case for free since that's just another way `session`
  // ends up set.
  useEffect(() => {
    if (loggedIn && goalLoaded && profileRole === null) {
      setShowRoleOnboarding(true);
    }
  }, [loggedIn, goalLoaded, profileRole]);

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

  const enrolledIds = enrolled.map((e) => e.courseId);

  // `courses` is the public catalogue (GET /courses) — deliberately
  // excludes soft-deleted courses (#41). But an enrolled learner's
  // dashboard/learning screen shouldn't lose access just because a
  // trainer deleted the course later, so fall back to the lightweight
  // course snapshot embedded on the enrollment itself (see
  // EnrolledCourseDto on the backend) for any id the catalogue doesn't
  // have. Only used for the learner-facing screens below — Trainer Studio
  // and the public catalogue correctly keep using `courses` as-is.
  const coursesForLearners = useMemo(() => {
    const catalogueIds = new Set(courses.map((c) => c.id));
    return [
      ...courses,
      ...enrolled
        .map((e) => e.course)
        .filter((c) => c && !catalogueIds.has(c.id)),
    ];
  }, [courses, enrolled]);

  useEffect(() => {
    const learningCourse =
      screen === "learning" ? coursesForLearners.find((c) => `/learning/${c.id}` === location.pathname) : null;
    const titles = {
      home: "Keystone Learning",
      catalogue: "Catalogue — Keystone",
      dashboard: "My Learning — Keystone",
      learning: learningCourse ? `${learningCourse.title} — Keystone` : "Keystone",
      trainer: "Trainer Studio — Keystone",
    };
    document.title = titles[screen] || "Keystone";
  }, [screen, location.pathname, coursesForLearners]);

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

    const saved = normalizeCourse(await res.json());

    setCourses((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved];
    });
    setToast(`Saved "${saved.title}"`);
    setTimeout(() => setToast(null), 2600);
    return saved;
  }

  // Soft delete (#41) — backend just stamps deleted_at rather than
  // removing the row, so existing enrollments/progress aren't touched.
  // Here that just means removing it from the local catalogue list.
  async function deleteCourse(courseId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/courses/${courseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setToast("Course deleted");
    setTimeout(() => setToast(null), 2600);
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

  // #106 — same pattern as saveProgress: PATCH the enrollment, merge the
  // returned row into `enrolled` by id so LearningScreen's `enrollment`
  // prop picks up the new rating on its next render without a refetch.
  async function submitRating(enrollmentId, rating) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/enrollments/${enrollmentId}/rating`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ rating }),
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
  }

  // #124 — fire-and-forget ping so the backend has a per-day "this module
  // was open" marker to split a module's completion minutes across later
  // (see ActivityService.logModuleView/logModuleCompletion). No response
  // body, no local state to update — LearningScreen calls this once per
  // module focus and doesn't need to await anything beyond error logging.
  async function logModuleView(moduleId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/modules/${moduleId}/view`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
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

    setEnrolling(true);
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
    } finally {
      setEnrolling(false);
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

  async function fetchCourseQuizResults(courseId) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/courses/${courseId}/quiz-results`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
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

  // #143 — course form's locked provider field. Reads from the backend
  // (profiles.name) rather than the client-cached Supabase user_metadata
  // set once at signup — the two happen to match today, but only the
  // backend value stays correct once a profile-editing feature exists.
  async function fetchMyProfile() {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/profiles/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  // #107 — called by GoalOnboardingModal when a learner taps a category.
  // Throws on failure (the modal catches it and lets them retry) rather
  // than swallowing the error, unlike most fire-and-forget calls in this
  // file — this one has a visible loading/retry state in its caller.
  async function updateGoal(goal) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/profiles/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ goal }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    const updated = await res.json();
    setLearnerGoal(updated.goal);
    setShowGoalOnboarding(false);
  }

  function skipGoalOnboarding() {
    setShowGoalOnboarding(false);
  }

  // #186 — called by RoleOnboardingModal when a Google sign-up picks
  // learner or trainer. Writes both halves of the role split found while
  // building this: `profiles.role` (what RequireTrainerGuard actually
  // authorizes trainer-only endpoints against) via the backend, and
  // Supabase Auth's user_metadata.role (what the `role` variable above —
  // and therefore all frontend nav/route gating — reads) via updateUser().
  // The updateUser() call fires a USER_UPDATED auth-state-change event that
  // AuthContext's existing listener already picks up, so `user` refreshes
  // on its own with no extra plumbing here.
  async function updateRole(role) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/profiles/me/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    const { error } = await supabase.auth.updateUser({ data: { role } });
    if (error) throw error;

    const updated = await res.json();
    setProfileRole(updated.role);
    setShowRoleOnboarding(false);
  }

  // #139 — Team tab. GET /providers/me 404s for "not a member of a
  // provider" (see ProvidersService.getMine) — that's a normal, expected
  // state here (the no-provider view), not an error, so it's translated
  // to null rather than thrown.
  async function fetchMyProvider() {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/providers/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }

  async function createProvider(name) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/providers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  async function joinProvider(inviteCode) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/providers/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ inviteCode }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  async function regenerateInviteCode() {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/providers/invite-code/regenerate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  async function leaveProvider() {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/providers/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Request failed: ${res.status}`);
    }
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

  // #187 — called by ResetPasswordModal once the PASSWORD_RECOVERY session
  // (from clicking the emailed reset link) is used to actually set a new
  // password. Throws on failure — same "let the modal show the error and
  // allow retry" contract as updateGoal/updateRole above — rather than
  // swallowing it here.
  async function handleSetNewPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    clearPasswordRecovery();
    setToast("Password updated");
    setTimeout(() => setToast(null), 2600);
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
    screen === "learning" ? (coursesForLearners.find((c) => `/learning/${c.id}` === location.pathname)?.title ?? "") :
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
              <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title="Home" user={user} goal={learnerGoal}>
                <HomeScreen onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)} onAuth={openAuth} courses={courses} loggedIn={loggedIn} user={user} enrolled={enrolled} />
              </AppShell>
            ) : (
              <HomeScreen onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)} onAuth={openAuth} courses={courses} loggedIn={loggedIn} user={user} enrolled={enrolled} />
            )
          }
        />

        <Route
          path="/catalogue"
          element={
            <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title={shellTitle} user={user} goal={learnerGoal}>
              <CatalogueScreen
                loggedIn={loggedIn}
                onGo={(key) => navigate(key === "home" ? "/" : `/${key}`)}
                onAuth={openAuth}
                onOpenCourse={setSelectedCourse}
                enrolledIds={enrolledIds}
                courses={courses}
                loading={coursesLoading}
              />
            </AppShell>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title={shellTitle} user={user} goal={learnerGoal}>
                <DashboardScreen
                  enrolled={enrolled}
                  onOpenCourse={setSelectedCourse}
                  onStartLearning={handleStartLearning}
                  courses={coursesForLearners}
                  onViewCertificate={viewCertificate}
                  user={user}
                  goal={learnerGoal}
                  activitySummary={activitySummary}
                  loading={coursesLoading || enrolledLoading}
                  calendarWeekOffset={calendarWeekOffset}
                  onPrevWeek={() => setCalendarWeekOffset((n) => n - 1)}
                  onNextWeek={() => setCalendarWeekOffset((n) => n + 1)}
                />
              </AppShell>
            </RequireAuth>
          }
        />

        <Route
          path="/learning/:courseId"
          element={
            <RequireAuth loggedIn={loggedIn}>
              <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title={shellTitle} user={user} goal={learnerGoal}>
                <LearningRoute
                  courses={coursesForLearners}
                  enrolled={enrolled}
                  coursesLoading={coursesLoading}
                  enrolledLoading={enrolledLoading}
                  onSaveProgress={saveProgress}
                  onSubmitRating={submitRating}
                  onLogModuleView={logModuleView}
                  onFetchQuiz={fetchQuiz}
                  onSubmitQuiz={submitQuiz}
                  onFetchQuizResults={fetchCourseQuizResults}
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
                <AppShell loggedIn={loggedIn} role={role} onLogout={handleLogout} title={shellTitle} user={user} goal={learnerGoal}>
                  <TrainerScreen
                    courses={courses}
                    onSaveCourse={saveCourse}
                    onDeleteCourse={deleteCourse}
                    onFetchQuizForEdit={fetchQuizForEdit}
                    onSaveQuiz={saveQuiz}
                    onFetchProvider={fetchMyProvider}
                    onFetchProfile={fetchMyProfile}
                    onCreateProvider={createProvider}
                    onJoinProvider={joinProvider}
                    onRegenerateInviteCode={regenerateInviteCode}
                    onLeaveProvider={leaveProvider}
                    currentUserId={user?.id}
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
        enrolling={enrolling}
      />

      <AuthModal
        mode={authMode}
        onClose={() => { setAuthMode(null); setPendingCourse(null); }}
        onSubmit={handleAuthSubmit}
      />

      <RoleOnboardingModal
        open={showRoleOnboarding}
        onSelect={updateRole}
      />

      <ResetPasswordModal
        open={passwordRecovery}
        onSubmit={handleSetNewPassword}
        onClose={clearPasswordRecovery}
      />

      <GoalOnboardingModal
        open={showGoalOnboarding}
        onSelect={updateGoal}
        onSkip={skipGoalOnboarding}
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