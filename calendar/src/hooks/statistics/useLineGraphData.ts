import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useLineGraphData() {
  const [lineGraphData, setLineGraphData] = useState<any[]>([]);
  const [lineGraphSelected, setLineGraphSelected] = useState("Day");
  const [lineGraphLoading, setLineGraphLoading] = useState(false);
  const [showAverageLineGraph, setShowAverageLineGraph] = useState(false);

  useEffect(() => {
    const fetchLineGraphData = async () => {
      setLineGraphLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URI}/statistics/line-graph?type=${lineGraphSelected}&average=${showAverageLineGraph}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch line graph data");
        const json = await res.json();
        setLineGraphData(json.data || []);
      } catch {
        toast.error("Failed to fetch line graph data");
      } finally {
        setLineGraphLoading(false);
      }
    };

    fetchLineGraphData();
  }, [lineGraphSelected, showAverageLineGraph]);

  return { lineGraphData, lineGraphSelected, setLineGraphSelected, lineGraphLoading, showAverageLineGraph, setShowAverageLineGraph };
}
