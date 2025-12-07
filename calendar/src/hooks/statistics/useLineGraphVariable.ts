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

export function useLineGraphVariable(colors: Colors) {
  const { user, userLoading } = useAuth();
  const [selection, setSelection] = useState<GraphSelection>({
    type: "activity",
    names: [],
    range: "year",
  });

  const [data, setData] = useState<Record<string, { date: Date; value: number }[]>>({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, { average: number; total: number }>>({});

  useEffect(() => {
    if (!colors?.variables) return;

    const keys = Object.keys(colors.variables);
    if (keys.length === 0) return;

    // Only set it if names is empty
    if (selection.names.length === 0) {
      setSelection(prev => ({
        ...prev,
        names: [keys[0]], // FIRST variable name
      }));
    }
  }, [colors]);


  useEffect(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (selection.range === "week") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    if (selection.range === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    if (selection.range === "year") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    // "all" = no cutoff → backend will receive null
    const endDate = now;

    const fetchGraphVar = async (name: string) => {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/statistics/line-graph-variable`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          varName: name,
          startDate: startDate ? startDate.toISOString().slice(0,10) : null,
          endDate: endDate.toISOString().slice(0,10),
        }),
      });
      if (!response.ok) throw new Error(`Failed to fetch ${name}`);
      const json = await response.json();
      return json || [];
    };

    const fetchAll = async () => {
      if (!user || userLoading || selection.names.length === 0) return;
      setLoading(true);
      
      try {
        console.log(`fetching those var: ${selection.names}`)
        // Fetch all selected variable names
        const results = await Promise.all(
          selection.names.map(n => fetchGraphVar(n))
        );

        const mergedData: Record<string, { date: Date; value: number }[]> = {};
        const statsData: Record<string, { average: number; total: number }> = {};

        results.forEach((raw, i) => {
  const name = selection.names[i];
  const parsed = raw.map((r: { date: string; value: number | null }) => ({
    date: new Date(r.date),
    value: Number(r.value) || 0,
  }));

  // Determine cutoff again (clean version)
  const now = new Date();
  let cutoff: Date | null = null;
  if (selection.range === "week") cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  if (selection.range === "month") cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  if (selection.range === "year") cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365);

  const filtered = cutoff ? parsed.filter(p => p.date >= cutoff) : parsed;

  // --- NEW PART: compute actual number of days in the range ---
  const realStart = cutoff ?? (filtered[0]?.date ?? new Date());
  const realEnd = new Date(); // same as endDate = now

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysInRange = Math.max(
    1,
    Math.ceil((realEnd.getTime() - realStart.getTime()) / msPerDay)
  );

  // Total stays the same
  const total = filtered.reduce((sum, e) => sum + e.value, 0);

  // NEW: divide by total number of days, even the empty ones
  const average = total / daysInRange;

  mergedData[name] = filtered;
  statsData[name] = { total, average };
});


        setData(mergedData);
        setStats(statsData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load line graph data.");
      }

      setLoading(false);
    };

    fetchAll();
  }, [selection, user, userLoading]);

  return { data, stats, selection, setSelection, loading };
}
