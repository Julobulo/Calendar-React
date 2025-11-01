import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface User {
  _id: string;
}

interface AuthContextType {
  user: User | null;
  userLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom event used by fetchWithAuth
const tokenRefreshedEvent = new Event("tokenRefreshed");
let refreshPromise: Promise<Response> | null = null;

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  let res = await fetch(input, { ...init, credentials: "include" });

  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = fetch(`${import.meta.env.VITE_API_URI}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      }).finally(() => (refreshPromise = null));
    }

    const refreshRes = await refreshPromise;

    if (refreshRes.ok) {
      window.dispatchEvent(tokenRefreshedEvent);
      res = await fetch(input, { ...init, credentials: "include" });
    }
  }

  return res;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setLoading] = useState(true);

  const fetchUser = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); // only show loading for initial fetch
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URI}/auth/me`);
      const data = await res.json();
      setUser(data.user ?? null);
      return data.user ?? null;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchUser(); // initial fetch

    const handleFocusOrVisible = async () => {
      await new Promise(r => setTimeout(r, 200)); // wait cookies
      const loggedInUser = await fetchUser();
      if (loggedInUser) window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleTokenRefresh = () => fetchUser();

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") handleFocusOrVisible();
    });
    window.addEventListener("tokenRefreshed", handleTokenRefresh);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      window.removeEventListener("tokenRefreshed", handleTokenRefresh);
    };
  }, [fetchUser]);

  // Polling approach: check every 2s until logged in
  useEffect(() => {
    if (user) return; // stop polling if already logged in

    const interval = setInterval(async () => {
      const loggedInUser = await fetchUser(true); // silent = true
      if (loggedInUser) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        clearInterval(interval); // stop polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user, fetchUser]);


  return (
    <AuthContext.Provider value={{ user, userLoading, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
