import { useEffect, useState } from "react";

export function useUserCount() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUserCount() {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/userCount`, {
          credentials: "include",
        });
        const data = await res.json();
        setUserCount(data.count);
      } finally {
        setLoading(false);
      }
    }
    fetchUserCount();
  }, []);

  return { userCount, loading };
}
