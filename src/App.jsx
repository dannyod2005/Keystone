import React, { useState, useEffect } from "react";
import {
  Search, PlayCircle, CheckCircle2, Award, Calendar as CalendarIcon,
  Clock, BookOpen, MessageSquare, FileText, ChevronDown, X,
  ArrowRight, LayoutGrid, GraduationCap, Bell, ChevronLeft,
  ChevronRight, Flame, Home as HomeIcon, HelpCircle, Menu,
  Mail, Lock, User, BookMarked, Eye, EyeOff,
  Pencil, Plus, Trash2, Video, Save
} from "lucide-react";

import { INITIAL_COURSES, ENROLLED_DEFAULT, TESTIMONIALS, LEARNER } from "./data/courses";
import { Stars, KeystoneArch, CategoryDot } from "./components/common/Primitives";
import { MarketingHeader } from "./components/layout/MarketingHeader";

/* ---------------------------------------------------------------
   KEYSTONE LEARNING — clickable prototype
--------------------------------------------------------------- */

/* ---------- Logged-in app shell ---------- */

function AppSidebar({ screen, onGo, role, onSwitchRole }) {
  const items = [
    { key: "dashboard", label: "My learning", icon: LayoutGrid },
    { key: "catalogue", label: "Catalogue", icon: BookOpen },
    { key: "home", label: "Discover", icon: HomeIcon },
  ];
  // ASSUMPTION: the trainer view is gated by a role flag (role === "trainer")
  // set when the account is created (see AuthModal's role toggle on the
  // signup tab). This nav item only renders for trainer accounts, mirroring
  // how the rest of the sidebar is already conditionally shown.
  if (role === "trainer") {
    items.push({ key: "trainer", label: "Trainer studio", icon: Pencil });
  }
  return (
    <aside style={{ width: 220, flexShrink: 0, background: "var(--ink)", color: "var(--paper)", padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4, minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px 22px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 2 L21 8 V22 H15 V14 H9 V22 H3 V8 Z" fill="var(--gold)" /></svg>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--paper)" }}>Keystone</span>
      </div>
      {items.map((it) => {
        const Icon = it.icon;
        const active = screen === it.key;
        return (
          <div key={it.key} onClick={() => onGo(it.key)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: active ? "var(--ink)" : "var(--paper)", background: active ? "var(--gold-tint)" : "transparent" }}>
            <Icon size={16} color={active ? "var(--gold-dark)" : "var(--paper)"} />
            {it.label}
          </div>
        );
      })}
      <hr style={{ border: "none", borderTop: "1px solid #FFFFFF22", margin: "16px 4px" }} />
      <div style={{ padding: "0 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--gold)", color: "#2B1E06", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>AC</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--paper)" }}>{LEARNER.name}</div>
          <div style={{ fontSize: 11, color: "#B9C0CC" }}>{role === "trainer" ? "Trainer account" : LEARNER.goal}</div>
        </div>
      </div>
      {/* ASSUMPTION: since there's no real backend, this is a demo-only
          convenience so reviewers can flip between the learner and trainer
          views in one session instead of creating two accounts. The "real"
          path is choosing a role on signup (see AuthModal). Remove this
          switch once role is decided at sign-up/invite time for real. */}
      {onSwitchRole && (
        <div
          onClick={onSwitchRole}
          style={{ margin: "12px 10px 0", fontSize: 11, color: "#B9C0CC", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
        >
          Switch to {role === "trainer" ? "learner" : "trainer"} view (demo)
        </div>
      )}
    </aside>
  );
}

function AppTopbar({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", width: 260 }}>
          <Search size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 11 }} />
          <input className="ks-input" placeholder="Search courses" />
        </div>
        <Bell size={18} color="var(--slate)" />
      </div>
    </div>
  );
}

/* ---------- Screen: Home (marketing) ---------- */

function HomeScreen({ onGo, onAuth, courses }) {
  return (
    <div>
      <MarketingHeader onGo={onGo} onAuth={onAuth} />
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "64px 28px 40px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
        <div>
          <span className="ks-badge" style={{ background: "var(--gold-tint)", color: "var(--gold-dark)" }}>For growing teams</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 46, lineHeight: 1.08, margin: "18px 0 16px" }}>
            Skills your team can point to, not just talk about.
          </h1>
          <p style={{ fontSize: 16, color: "var(--slate)", lineHeight: 1.6, maxWidth: 460 }}>
            Short, project-based courses in AI, data, and leadership — built so a busy person can actually finish them.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
            <button className="ks-btn ks-btn-gold" style={{ padding: "12px 22px", fontSize: 15 }} onClick={() => onAuth("signup")}>Get started free</button>
            <button className="ks-btn ks-btn-ghost" style={{ padding: "12px 22px", fontSize: 15 }} onClick={() => onGo("catalogue")}>
              Browse catalogue <ArrowRight size={15} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 34 }}>
            {[["40,000+", "learners"], ["120+", "courses"], ["4.8", "avg. rating"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: 20 }}>{n}</div>
                <div style={{ fontSize: 12, color: "var(--slate-light)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="ks-card" style={{ padding: 22, position: "relative" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>Continue where you left off</div>
          {courses.slice(0, 3).map((c) => (
            <div key={c.id} onClick={() => onGo("catalogue")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 10, cursor: "pointer" }}>
              <KeystoneArch progress={c.id === "c1" ? 0.62 : c.id === "c2" ? 0.1 : 0.2} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "var(--slate-light)" }}>{c.provider}</div>
              </div>
              <ChevronRight size={15} color="var(--slate-light)" />
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "20px 28px 56px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, margin: 0 }}>Popular this month</h2>
          <span onClick={() => onGo("catalogue")} style={{ fontSize: 13.5, fontWeight: 600, color: "var(--gold-dark)", cursor: "pointer" }}>View catalogue →</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {courses.slice(0, 3).map((c) => (
            <div key={c.id} className="ks-card" onClick={() => onGo("catalogue")} style={{ padding: 18, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <CategoryDot color={c.color} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{c.category}</span>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5, marginBottom: 14 }}>{c.blurb}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Stars rating={c.rating} />
                <span style={{ fontSize: 12, color: "var(--slate-light)" }}>{c.hours}h</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--ink)", padding: "56px 28px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, color: "var(--paper)", marginBottom: 22 }}>What learners say</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ background: "#1E2C4A", border: "1px solid #2A3A5C", borderRadius: 14, padding: 20 }}>
                <Stars rating={t.rating} />
                <p style={{ color: "#DDE2EA", fontSize: 14, lineHeight: 1.55, margin: "12px 0 16px" }}>{t.quote}</p>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--paper)" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#8B93A0" }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px", textAlign: "center", fontSize: 12.5, color: "var(--slate-light)" }}>
        Keystone Learning — clickable prototype for demo purposes.
      </footer>
    </div>
  );
}

/* ---------- Screen: Catalogue ---------- */

function CatalogueScreen({ loggedIn, onGo, onOpenCourse, onAuth, enrolledIds, courses }) {
  const [filter, setFilter] = useState("All");
  const cats = ["All", "Technical", "Business", "Leadership"];
  const filtered = filter === "All" ? courses : courses.filter((c) => c.category === filter);

  return (
    <div>
      {!loggedIn && <MarketingHeader onGo={onGo} onAuth={onAuth} />}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 60px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, margin: "0 0 6px" }}>Course catalogue</h1>
        <p style={{ color: "var(--slate)", fontSize: 14, margin: "0 0 22px" }}>{courses.length} courses across technical, business, and leadership tracks.</p>

        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 11 }} />
            <input className="ks-input" placeholder="Search by title, skill, or provider" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {cats.map((c) => (
              <span key={c} onClick={() => setFilter(c)}
                style={{ fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 100, cursor: "pointer",
                  background: filter === c ? "var(--ink)" : "var(--paper-2)", color: filter === c ? "var(--paper)" : "var(--slate)",
                  border: "1px solid var(--line)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {filtered.map((c) => {
            const isEnrolled = enrolledIds.includes(c.id);
            return (
              <div key={c.id} className="ks-card" onClick={() => onOpenCourse(c)} style={{ padding: 18, cursor: "pointer", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CategoryDot color={c.color} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{c.category}</span>
                  </div>
                  {isEnrolled && <span className="ks-badge" style={{ background: "var(--success-tint)", color: "var(--success)" }}>Enrolled</span>}
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--slate-light)", marginBottom: 10 }}>{c.provider}</div>
                <div style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{c.blurb}</div>
                <hr className="ks-hairline" style={{ margin: "0 0 12px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Stars rating={c.rating} />
                  <span style={{ fontSize: 12, color: "var(--slate-light)", fontFamily: "var(--font-mono)" }}>{c.hours}h · {c.level}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Course detail modal ---------- */

function CourseDetailModal({ course, onClose, onEnrol, isEnrolled }) {
  if (!course) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#16233Db3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="ks-card" style={{ width: "100%", maxWidth: 620, maxHeight: "86vh", overflowY: "auto", padding: 0 }}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <CategoryDot color={course.color} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--slate-light)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{course.category} · {course.level}</span>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 24, margin: 0 }}>{course.title}</h2>
            <div style={{ fontSize: 13, color: "var(--slate-light)", marginTop: 4 }}>{course.provider}</div>
          </div>
          <X size={20} color="var(--slate)" style={{ cursor: "pointer", flexShrink: 0 }} onClick={onClose} />
        </div>

        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", gap: 22, marginBottom: 18, fontSize: 13, color: "var(--slate)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={14} /> {course.hours} hours</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><FileText size={14} /> {course.projects} projects</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Stars rating={course.rating} /> {course.rating} ({course.learners.toLocaleString()})</span>
          </div>
          <p style={{ fontSize: 14.5, color: "var(--ink-70)", lineHeight: 1.6, marginBottom: 22 }}>{course.blurb}</p>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 10 }}>Course agenda</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 22 }}>
            {course.agenda.map((a, i) => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < course.agenda.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--slate-light)", width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 14 }}>{a}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)", marginBottom: 10 }}>FAQ</div>
          <div style={{ marginBottom: 22 }}>
            {/* ASSUMPTION: course.faq is a new optional [{q,a}] field a trainer
                can author (see TrainerScreen). Falls back to the original
                hardcoded copy for courses that don't have one yet. */}
            {(course.faq && course.faq.length > 0
              ? course.faq
              : [
                  { q: "Do I get a certificate?", a: "Yes — issued automatically once all modules and the final project are complete." },
                  { q: "Can I go at my own pace?", a: "Yes, all modules stay open for the life of your account." },
                ]
            ).map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{item.q}</div>
                <div style={{ fontSize: 13.5, color: "var(--slate)", marginBottom: 12 }}>{item.a}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <BookMarked size={13} color="var(--slate-light)" />
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--slate-light)" }}>Sources & credits</span>
          </div>
          <ul style={{ margin: "0 0 22px", padding: 0, listStyle: "none" }}>
            {course.credits.map((line, i) => (
              <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--slate)", lineHeight: 1.55, padding: "5px 0", borderBottom: i < course.credits.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ color: "var(--gold-dark)", flexShrink: 0 }}>·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <button className="ks-btn ks-btn-gold" style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15 }}
            onClick={() => onEnrol(course)} disabled={isEnrolled}>
            {isEnrolled ? <><CheckCircle2 size={16} /> Already enrolled — go to My learning</> : <>Enrol now <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Auth modal (log in / create account) ---------- */

function AuthModal({ mode, onClose, onSubmit }) {
  const [tab, setTab] = useState(mode || "login");
  const [showPw, setShowPw] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", password: "", role: "learner" });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (mode) { setTab(mode); setTouched(false); setSubmitting(false); }
  }, [mode]);

  if (!mode) return null;

  const emailValid = /\S+@\S+\.\S+/.test(values.email);
  const pwValid = values.password.length >= 8;
  const nameValid = tab === "login" || values.name.trim().length > 1;
  const canSubmit = emailValid && pwValid && nameValid;

  function update(field, v) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    // Demo: simulate a brief network round-trip before "authenticating"
    setTimeout(() => {
      onSubmit(tab, values);
    }, 450);
  }

  const field = {
    marginBottom: 16,
  };
  const label = {
    display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6,
  };
  const inputWrap = { position: "relative" };
  const errorText = { fontSize: 11.5, color: "var(--coral)", marginTop: 5 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#16233Db3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="ks-card" style={{ width: "100%", maxWidth: 400, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "24px 28px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="19" height="19" viewBox="0 0 24 24"><path d="M12 2 L21 8 V22 H15 V14 H9 V22 H3 V8 Z" fill="var(--ink)" /></svg>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Keystone</span>
            </div>
            <X size={19} color="var(--slate)" style={{ cursor: "pointer" }} onClick={onClose} />
          </div>

          <div style={{ display: "flex", gap: 20, borderBottom: "1px solid var(--line)" }}>
            <div className={`ks-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setTouched(false); }}>Log in</div>
            <div className={`ks-tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setTouched(false); }}>Create account</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "22px 28px 26px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, marginBottom: 4 }}>
            {tab === "login" ? "Welcome back" : "Start learning free"}
          </div>
          <div style={{ fontSize: 13, color: "var(--slate)", marginBottom: 20 }}>
            {tab === "login" ? "Log in to pick up where you left off." : "No credit card required — cancel anytime."}
          </div>

          {tab === "signup" && (
            <div style={field}>
              <label style={label} htmlFor="ks-name">Full name</label>
              <div style={inputWrap}>
                <User size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 12 }} />
                <input id="ks-name" className="ks-input" placeholder="Jordan Lee" autoComplete="name"
                  value={values.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              {touched && !nameValid && <div style={errorText}>Enter your name.</div>}
            </div>
          )}

          {/* ASSUMPTION: role is chosen at signup and stored on the mock
              account — this is the "real" (non-demo) way to reach the
              Trainer studio, since there's no invite/admin system in this
              prototype. */}
          {tab === "signup" && (
            <div style={field}>
              <label style={label}>Account type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["learner", "Learner"], ["trainer", "Trainer"]].map(([v, l]) => (
                  <span key={v} onClick={() => update("role", v)}
                    style={{
                      flex: 1, textAlign: "center", fontSize: 13, fontWeight: 600, padding: "9px 0", borderRadius: 8, cursor: "pointer",
                      border: "1px solid var(--line)",
                      background: values.role === v ? "var(--ink)" : "var(--paper-2)",
                      color: values.role === v ? "var(--paper)" : "var(--slate)",
                    }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={field}>
            <label style={label} htmlFor="ks-email">Email address</label>
            <div style={inputWrap}>
              <Mail size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 12 }} />
              <input id="ks-email" type="email" className="ks-input" placeholder="you@company.com" autoComplete="email"
                value={values.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            {touched && !emailValid && <div style={errorText}>Enter a valid email address.</div>}
          </div>

          <div style={{ ...field, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={label} htmlFor="ks-pw">Password</label>
              {tab === "login" && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold-dark)", cursor: "pointer", marginBottom: 6 }}>Forgot password?</span>}
            </div>
            <div style={inputWrap}>
              <Lock size={15} color="var(--slate-light)" style={{ position: "absolute", left: 13, top: 12 }} />
              <input id="ks-pw" type={showPw ? "text" : "password"} className="ks-input" style={{ paddingRight: 40 }}
                placeholder={tab === "signup" ? "At least 8 characters" : "Your password"}
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                value={values.password} onChange={(e) => update("password", e.target.value)} />
              {showPw
                ? <EyeOff size={15} color="var(--slate-light)" style={{ position: "absolute", right: 13, top: 12, cursor: "pointer" }} onClick={() => setShowPw(false)} />
                : <Eye size={15} color="var(--slate-light)" style={{ position: "absolute", right: 13, top: 12, cursor: "pointer" }} onClick={() => setShowPw(true)} />}
            </div>
            {touched && !pwValid && <div style={errorText}>Password must be at least 8 characters.</div>}
          </div>

          <button type="submit" className="ks-btn ks-btn-gold" style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15, marginTop: 10, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Please wait…" : tab === "login" ? "Log in" : "Create free account"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <hr className="ks-hairline" style={{ flex: 1 }} /><span style={{ fontSize: 11.5, color: "var(--slate-light)" }}>OR</span><hr className="ks-hairline" style={{ flex: 1 }} />
          </div>
          <button type="button" className="ks-btn ks-btn-ghost" style={{ width: "100%", justifyContent: "center", padding: "10px 0" }}
            onClick={() => { setTouched(true); if (emailValid || tab === "signup") { setSubmitting(true); setTimeout(() => onSubmit(tab, { ...values, provider: "google" }), 450); } }}>
            <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1z"/><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75z"/></svg>
            Continue with Google
          </button>

          <div style={{ fontSize: 11.5, color: "var(--slate-light)", textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
            Demo prototype — any valid-looking email &amp; an 8+ character password will work.
          </div>
        </form>
      </div>
    </div>
  );
}

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
