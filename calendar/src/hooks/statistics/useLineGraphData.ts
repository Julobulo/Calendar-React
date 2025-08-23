import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export function useLineGraphData() {
  const [lineGraphData, setLineGraphData] = useState<any[]>([]);
  const [lineGraphSelected, setLineGraphSelected] = useState<{ type: "activity" | "variable", name: string }>({
    type: "activity",
    name: "activity-total",
  });
  const [lineGraphLoading, setLineGraphLoading] = useState(false);

  useEffect(() => {
    const fetchLineGraphData = async () => {
      if (!lineGraphSelected) return;
      setLineGraphLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URI}/statistics/line-graph`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: lineGraphSelected?.type, name: lineGraphSelected?.name.split("-")[1] }),
        });
        if (!response.ok) {
          toast.error(`Failed to fetch line graph data: ${(await response.json()).message}`);
          setLineGraphLoading(false);
          return
        }
        const json = await response.json();
        // setLineGraphData(json.data || []);
        const rawData: { date: string; value: number | null }[] = json.data || [];

        // Convert date strings to Date objects
        const parsedData = rawData.map(entry => ({
          date: new Date(entry.date),
          value: entry.value ?? 0,
        }));

        // Find min and max dates (by converting to timestamps)
        const timestamps = parsedData.map(entry => entry.date.getTime());
        const minDate = new Date(Math.min(...timestamps));
        // const maxDate = new Date(Math.max(...timestamps));
        const maxDate = new Date();

        // Generate all dates in the range
        const allDates: Date[] = [];
        const current = new Date(minDate);
        while (current <= maxDate) {
          // Set the time to 12:00:00 to ensure consistency
          current.setHours(12, 0, 0, 0);
          allDates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }

        // Map existing dates to strings for easier lookup
        const dataMap = new Map(parsedData.map(d => [d.date.toISOString().split("T")[0], d.value]));

        // Fill in missing dates
        const filledData = allDates.map(date => {
          const key = date.toISOString().split("T")[0];
          return {
            date,
            value: dataMap.has(key) ? dataMap.get(key)! : 0,
          };
        });

        // setLineGraphData(filledData);

        // 1. Calculate average (ignoring nulls if needed)
        const total = filledData.reduce((sum, entry) => sum + (Number(entry.value) ?? 0), 0);
        const count = filledData.filter(entry => entry.value !== null).length;
        const average = count > 0 ? total / count : 0;

        // 2. Add average + trendline
        const withAverageAndTrendline = filledData.map(entry => ({
          ...entry,
          average,
          trendlineValue: entry.value === 0 ? null : entry.value, // only draw if > 0
        }));

        setLineGraphData(withAverageAndTrendline);
      } catch (err) {
        console.error(err);
        toast.error(err?.toString());
      }
      setLineGraphLoading(false);
    };

    if (Cookies.get('token')) fetchLineGraphData();
  }, [lineGraphSelected]);

  return { lineGraphData, lineGraphSelected, setLineGraphSelected, lineGraphLoading };
}
