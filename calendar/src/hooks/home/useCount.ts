import { useEffect, useState } from "react";

export function useUserCount() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [activityCount, setActivityCount] = useState<number | null>(null);
  const [loggedInCount, setLoggedInCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUserCount() {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/dbCount`, {
          credentials: "include",
        });
        const data = await res.json();
        setUserCount(data.userCount);
        setActivityCount(data.activityCount);
        setLoggedInCount(data.loggedInCount);
      } finally {
        setLoading(false);
      }
    }
    fetchUserCount();
  }, []);

  return { userCount, activityCount, loggedInCount, loading };
}
