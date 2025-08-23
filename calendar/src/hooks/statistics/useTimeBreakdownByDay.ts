import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useTimeBreakdownByDay() {
  const [timeBreakdownByDayData, setTimeBreakdownByDayData] = useState<any[]>([]);
  const [timeBreakdownByDayLoading, setTimeBreakdownByDayLoading] = useState(false);

  useEffect(() => {
    const fetchBreakdown = async () => {
      setTimeBreakdownByDayLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/time-breakdown-by-day`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch time breakdown");
        const json = await res.json();
        setTimeBreakdownByDayData(json.data || []);
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
