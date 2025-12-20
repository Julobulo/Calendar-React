import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../AuthProvider";
import { Colors } from "../../utils/types";

export type GraphType = "activity" | "variable";
export type TimeRange = "all" | "year" | "month" | "week";

interface GraphSelection {
    type: GraphType;
    names: string[];
    range: TimeRange;
}

interface Point {
    date: Date;
    value: number; // minutes
}

interface Stat {
    total: number;
    average: number; // per day
    averageWeek: number;
    max: number;     // max minutes in a single day
}

export function useLineGraphActivity(colors: Colors) {
    const { user, userLoading } = useAuth();

    const [selection, setSelection] = useState<GraphSelection>({
        type: "activity",
        names: [],
        range: "year",
    });

    const [data, setData] = useState<Record<string, Point[]>>({});
    const [stats, setStats] = useState<Record<string, Stat>>({});
    const [loading, setLoading] = useState(false);

    // 👉 Auto-pick first activity color
    useEffect(() => {
        if (!colors?.activities) return;
        const keys = Object.keys(colors.activities);
        if (keys.length === 0) return;

        if (selection.names.length === 0) {
            setSelection(prev => ({
                ...prev,
                names: [keys[0]],
            }));
        }
    }, [colors]);

    useEffect(() => {
        if (!user || userLoading || selection.names.length === 0) return;

        const now = new Date();
        let startDate: Date | null = null;

        if (selection.range === "week") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        }
        if (selection.range === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        }
        if (selection.range === "year") {
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        }
        const endDate = now;

        const fetchGraphActivity = async (name: string) => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URI}/statistics/line-graph-activity`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        activity: name,
                        startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
                        endDate: endDate.toISOString().slice(0, 10),
                    }),
                }
            );
            if (!res.ok) throw new Error(`Failed to fetch ${name}`);
            return res.json();
        };

        const fetchAll = async () => {
            setLoading(true);
            try {
                const results = await Promise.all(
                    selection.names.map(n => fetchGraphActivity(n))
                );

                // ---- build full list of days in range ----
                const realStart = startDate ?? new Date(
                    Math.min(
                        ...results.flat().map((r: any) => new Date(r.date).getTime())
                    )
                );

                const start = new Date(realStart);
                start.setHours(0, 0, 0, 0);

                const end = new Date(endDate);
                end.setHours(0, 0, 0, 0);

                const allDates: Date[] = [];
                for (
                    let d = new Date(start);
                    d <= end;
                    d.setDate(d.getDate() + 1)
                ) {
                    allDates.push(new Date(d));
                }

                const daysInRange = allDates.length;

                const merged: Record<string, Point[]> = {};
                const statData: Record<string, Stat> = {};
                let combinedTotal = 0;

                // ---- fill missing days with 0 ----
                results.forEach((raw, i) => {
                    const name = selection.names[i];

                    const map = new Map<string, number>();
                    raw.forEach((r: any) => {
                        const key = new Date(r.date).toISOString().slice(0, 10);
                        map.set(key, Number(r.minutes) || 0);
                    });

                    const filled: Point[] = allDates.map(d => {
                        const key = d.toISOString().slice(0, 10);
                        return {
                            date: new Date(d),
                            value: map.get(key) ?? 0,
                        };
                    });

                    const total = filled.reduce((s, e) => s + e.value, 0);
                    const max = Math.max(...filled.map(e => e.value), 0);
                    const average = total / daysInRange;
                    const averageWeek = average * 7;

                    combinedTotal += total;

                    merged[name] = filled;
                    statData[name] = { total, average, averageWeek, max };
                });

                // ---- combined stats ----
                const combinedAverage = combinedTotal / daysInRange;
                statData["__total"] = {
                    total: combinedTotal,
                    average: combinedAverage,
                    averageWeek: combinedAverage * 7,
                    max: Math.max(
                        ...Object.values(statData).map(s => s.max ?? 0),
                        0
                    ),
                };

                setData(merged);
                setStats(statData);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load activity graph data.");
            }
            setLoading(false);
        };

        fetchAll();
    }, [selection, user, userLoading]);

    return {
        data,
        stats,            // includes "__total"
        selection,
        setSelection,
        loading,
    };
}
