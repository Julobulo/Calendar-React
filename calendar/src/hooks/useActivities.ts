import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { UserActivity } from "../utils/types";

export function useActivities(year: number, month: number) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URI}/activity?year=${year}&month=${month}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          const { message } = await response.json();
          toast.error(`Failed to fetch activities: ${message}`);
          return;
        }
        const data: UserActivity[] = await response.json();
        setActivities(data);
      } finally {
        setLoading(false);
      }
    };

    if (Cookies.get("token")) fetchActivities();
  }, [year, month]);

  return { activities, loading };
}
