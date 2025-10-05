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

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  let res = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (res.status === 401) {
    // Try to refresh token
    const refreshRes = await fetch(`${import.meta.env.VITE_API_URI}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      // Retry original request
      res = await fetch(input, {
        ...init,
        credentials: "include",
      });
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
      // const res = await fetch(`${import.meta.env.VITE_API_URI}/auth/me`, {
      //   credentials: "include",
      // });
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
