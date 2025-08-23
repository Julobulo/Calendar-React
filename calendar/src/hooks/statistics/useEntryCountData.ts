import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DailyActivity } from "../../utils/types";

export function useEntryCountData() {
    const [entryCountData, setEntryCountData] = useState<any[]>([]);
    const [heatmapLoading, setHeatmapLoading] = useState(false);
    const [heatmapType, setHeatmapType] = useState<"all" | "activities" | "variables" | "notes">("all");
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [maxCount, setMaxCount] = useState(0);

    useEffect(() => {
        const fetchEntryCount = async () => {
            setHeatmapLoading(true);
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URI}/statistics/daily-activity-count`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error("Failed to fetch entry count");
                const data: DailyActivity[] = await res.json();
                setEntryCountData(data);
                setMaxCount(Math.max(...data.map(d => d.count.activityCount + d.count.variableCount + d.count.note), 10));
            } catch {
                toast.error("Failed to fetch entry count");
            } finally {
                setHeatmapLoading(false);
            }
        };

        fetchEntryCount();
    }, []);

    return { entryCountData, heatmapLoading, heatmapType, setHeatmapType, selectedYear, setSelectedYear, maxCount };
}
