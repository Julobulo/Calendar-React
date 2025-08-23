import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { ActivityEntry, UserActivity } from "../utils/types";

export function useDayActivities(year: number, month: number, day: number, reload: boolean) {
  const [activities, setActivities] = useState<UserActivity>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!Cookies.get("token")) return;

    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URI}/activity?year=${year}&month=${month}&day=${day}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          toast.error(`Failed to fetch activities: ${(await response.json()).message}`);
          return;
        }

        const data: UserActivity[] = await response.json();

        const sortedEntries = data[0]?.entries.sort((a: ActivityEntry, b: ActivityEntry) => {
          if (a.start && b.start) return a.start.localeCompare(b.start);
          if (a.start) return -1;
          if (b.start) return 1;
          return 0;
        });

        setActivities(data[0] ? { ...data[0], entries: sortedEntries || [] } : undefined);
      } catch (err) {
        toast.error("Unexpected error fetching activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [year, month, day, reload]);

  return { activities, loading };
}
