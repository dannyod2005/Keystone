import React, { useState } from "react";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { KeystoneMark } from "../common/Primitives";

export function AuthModal({ mode, onClose, onSubmit }) {
  const [tab, setTab] = useState(mode || "login");
  const [showPw, setShowPw] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", password: "", role: "learner" });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [confirmEmailMessage, setConfirmEmailMessage] = useState(null);

  React.useEffect(() => {
    if (mode) {
      setTab(mode);
      setTouched(false);
      setSubmitting(false);
      setAuthError(null);
      setConfirmEmailMessage(null);
    }
  }, [mode]);

  if (!mode) return null;

  const emailValid = /\S+@\S+\.\S+/.test(values.email);
  const pwValid = values.password.length >= 8;
  const nameValid = tab === "login" || values.name.trim().length > 1;
  const canSubmit = emailValid && pwValid && nameValid;

  function update(field, v) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setAuthError(null);
    setConfirmEmailMessage(null);
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { name: values.name, role: values.role },
          },
        });
        if (error) throw error;

        if (!data.session) {
          // Email confirmation required — no session yet.
          setConfirmEmailMessage(
            "Check your email to confirm your account, then log in.",
          );
          setSubmitting(false);
          return;
        }

        onSubmit(data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;

        onSubmit(data.session);
      }
    } catch (err) {
      setAuthError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
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
              <KeystoneMark variant="light" size={19} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>Keystone</span>
            </div>
            <X size={19} color="var(--slate)" style={{ cursor: "pointer" }} onClick={onClose} />
          </div>

          <div style={{ display: "flex", gap: 20, borderBottom: "1px solid var(--line)" }}>
            <div className={`ks-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setTouched(false); setAuthError(null); }}>Log in</div>
            <div className={`ks-tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setTouched(false); setAuthError(null); }}>Create account</div>
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

          {authError && <div style={{ ...errorText, marginBottom: 12 }}>{authError}</div>}
          {confirmEmailMessage && (
            <div style={{ fontSize: 12.5, color: "var(--success)", marginBottom: 12 }}>{confirmEmailMessage}</div>
          )}

          <button type="submit" className="ks-btn ks-btn-gold" style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15, marginTop: 10, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Please wait…" : tab === "login" ? "Log in" : "Create free account"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <hr className="ks-hairline" style={{ flex: 1 }} /><span style={{ fontSize: 11.5, color: "var(--slate-light)" }}>OR</span><hr className="ks-hairline" style={{ flex: 1 }} />
          </div>
          {/* Google OAuth requires a redirect flow (dashboard config + a
              return route) that doesn't fit this modal's synchronous
              submit pattern. Disabled for now — see #22's PR notes. */}
          <button type="button" className="ks-btn ks-btn-ghost" style={{ width: "100%", justifyContent: "center", padding: "10px 0", opacity: 0.5, cursor: "not-allowed" }}
            disabled title="Coming soon">
            <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1z"/><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75z"/></svg>
            Continue with Google (coming soon)
          </button>

          <div style={{ fontSize: 11.5, color: "var(--slate-light)", textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
            Real accounts — passwords are securely handled by Supabase Auth.
          </div>
        </form>
      </div>
    </div>
  );
}