import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { UserActivity } from "../../utils/types";
import { getDiffBetweenTimes } from "../../utils/helpers";

export function useTimeBreakdownByDay() {
  const [timeBreakdownByDayData, setTimeBreakdownByDayData] = useState<UserActivity[]>([]);
  const [timeBreakdownByDayLoading, setTimeBreakdownByDayLoading] = useState(false);

  useEffect(() => {
    const fetchBreakdown = async () => {
      setTimeBreakdownByDayLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/latest-week-data`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch time breakdown");
        const json = await res.json();

        // Convert activities into chart-friendly format
        setTimeBreakdownByDayData(json.map((activityDocument: UserActivity) => {
          const day = new Date(activityDocument.date).toLocaleDateString("en-US", { weekday: "short" });
          const dayData: any = { day };

          for (const entry of activityDocument?.entries || []) {
            if (getDiffBetweenTimes(entry.start || "", entry.end || "") > 0) {
              dayData[entry.activity] = getDiffBetweenTimes(entry.start || "", entry.end || "");
              // if (entry.activity === "Studying") console.log(`entry.activity: ${entry.activity}, entry.duration: ${entry.duration}, dayData[entry.activity]: ${dayData[entry.activity]}`)
            }
          }

          return dayData;
        }))
      } catch {
        toast.error("Failed to fetch time breakdown");
      } finally {
        setTimeBreakdownByDayLoading(false);
      }
    };

    fetchBreakdown();
  }, []);

  return { timeBreakdownByDayData, timeBreakdownByDayLoading };
}
