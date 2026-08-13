import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // #187 — clicking the emailed reset link lands back on the app with a
  // real (temporary) session already established, and Supabase fires a
  // dedicated PASSWORD_RECOVERY event for that specific case rather than
  // the generic SIGNED_IN — this is how App.jsx knows to show
  // ResetPasswordModal instead of just treating it as a normal login.
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    // Get the current session when the app starts
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for future login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    loading,
    passwordRecovery,
    // #187 — called once ResetPasswordModal's job is done (password set,
    // or the user dismisses it), so it doesn't keep reopening for the
    // rest of this session.
    clearPasswordRecovery: () => setPasswordRecovery(false),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}