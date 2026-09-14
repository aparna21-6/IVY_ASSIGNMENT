import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import * as api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(api.getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const refreshTimer = useRef(null);

  const scheduleRefresh = useCallback((email, password, expiresInSeconds) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (!expiresInSeconds) return;
    // Refresh at 80% of the token's life so we're never caught relying on
    // a 401 mid-interaction. If expires_in is small (e.g. 900s), this
    // fires every ~12 minutes — comfortably inside the 30-minute
    // "still working" requirement.
    const delayMs = Math.max(10_000, expiresInSeconds * 0.8 * 1000);
    refreshTimer.current = setTimeout(async () => {
      try {
        const data = await api.login(email, password);
        scheduleRefresh(email, password, data.expires_in);
      } catch {
        // If silent refresh fails, the next real request will 401 and
        // the user gets sent back to /login by ProtectedRoute.
      }
    }, delayMs);
  }, []);

  // On mount (e.g. after a page refresh), re-arm the refresh timer from
  // whatever session state survived, using the remaining time on the
  // token rather than its full lifetime.
  useEffect(() => {
    const email = sessionStorage.getItem("ivy_email");
    const password = sessionStorage.getItem("ivy_password");
    const expiresIn = Number(sessionStorage.getItem("ivy_expires_in") || 0);
    const tokenAt = Number(sessionStorage.getItem("ivy_token_at") || 0);
    if (email && password && expiresIn && tokenAt) {
      const elapsedSeconds = (Date.now() - tokenAt) / 1000;
      const remaining = Math.max(5, expiresIn - elapsedSeconds);
      scheduleRefresh(email, password, remaining / 0.8);
    }
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.login(email, password);
        setUser(data.user);
        scheduleRefresh(email, password, data.expires_in);
        return data.user;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [scheduleRefresh]
  );

  const doLogout = useCallback(async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login: doLogin, logout: doLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
