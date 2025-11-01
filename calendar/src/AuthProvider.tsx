// AuthContext.tsx
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

// A custom event to tell all listeners that tokens were refreshed
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

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URI}/auth/me`);
      const data = await res.json();
      setUser(data.user ?? null);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // When the page becomes visible again (after login popup)
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchUser();
      }
    };

    // When tokens are refreshed elsewhere (in-flight request)
    const onTokenRefreshed = () => {
      fetchUser();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("tokenRefreshed", onTokenRefreshed);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("tokenRefreshed", onTokenRefreshed);
    };

  }, [fetchUser]);

  useEffect(() => {
    const handleFocus = () => {
      // Refetch user if page gains focus (e.g. after OAuth login redirect)
      fetchUser();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("tokenRefreshed", fetchUser);

    fetchUser(); // initial fetch on mount

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("tokenRefreshed", fetchUser);
    };
  }, [fetchUser]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchUser();
      // Give browser time to commit cookies
      await new Promise(r => setTimeout(r, 300));
      setLoading(false);
    };
    load();
  }, [fetchUser]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      console.log("Received message:", event.origin, event.data);
      if (event.data?.type === "loginSuccess") {
        setTimeout(() => fetchUser(), 300);
      }

    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [fetchUser]);


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

