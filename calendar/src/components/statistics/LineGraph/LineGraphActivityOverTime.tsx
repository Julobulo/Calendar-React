import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useState, useMemo } from "react";
import { formatTime } from "../../../utils/helpers";

interface Props {
    data: Record<string, { date: Date; value: number }[]>;
    stats: Record<string, { average: number; total: number; max: number }>;
    selection: { type: "activity" | "variable"; names: string[]; range: string };
    setSelection: (s: any) => void;
    loading: boolean;
    colors: Record<string, string>;
}

export default function LineGraphActivity({
    data,
    stats,
    selection,
    setSelection,
    loading,
    colors,
}: Props) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // ---- Merge data for Recharts ----
    const dateKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const merged = useMemo(() => {
        const allDates = new Set<string>();

        Object.values(data).forEach(list =>
            list.forEach(d => allDates.add(dateKey(d.date)))
        );

        const sortedDates = [...allDates].sort();

        return sortedDates.map(key => {
            const entry: any = { date: key };
            for (const name of Object.keys(data)) {
                const found = data[name].find(e => dateKey(e.date) === key);
                entry[name] = found?.value ?? 0;
            }
            return entry;
        });
    }, [data]);

    const toggleActivity = (a: string) => {
        const already = selection.names.includes(a);
        setSelection({
            ...selection,
            names: already
                ? selection.names.filter(x => x !== a)
                : [...selection.names, a],
        });
    };

    const changeRange = (range: string) =>
        setSelection({ ...selection, range });

    // ---- Human-readable tooltip ----
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || payload.length === 0) return null;

        const readable = new Date(label).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        return (
            <div className="bg-white p-3 border rounded shadow text-sm">
                <div className="font-semibold mb-1">{readable}</div>
                {payload.map((p: any) => (
                    <div
                        key={p.dataKey}
                        className="flex justify-between"
                        style={{ color: p.color }}
                    >
                        <span>{p.dataKey}</span>
                        <span>{formatTime(Number(p.value) || 0)}</span>
                    </div>
                ))}
            </div>
        );
    };

    // ---- Combined stats for all selected activities ----
    const combined = useMemo(() => {
        let total = 0;
        let avgPerDay = 0;

        selection.names.forEach(name => {
            const s = stats[name];
            if (!s) return;
            total += s.total;
            avgPerDay += s.average; // averages are per-day → sum them
        });

        return { total, average: avgPerDay };
    }, [stats, selection.names]);

    return (
        <div className="bg-white shadow rounded-2xl p-6 space-y-6 my-3">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Activities Over Time</h2>

                <select
                    className="border p-2 rounded-md"
                    value={selection.range}
                    onChange={e => changeRange(e.target.value)}
                >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="year">Last Year</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            {/* Multi-select Dropdown */}
            <div className="relative">
                <button
                    className="border px-3 py-2 rounded-md w-full text-left"
                    onClick={() => setDropdownOpen(x => !x)}
                >
                    {selection.names.length === 0
                        ? "Select Activities..."
                        : selection.names.join(", ")}
                </button>

                {dropdownOpen && (
                    <div className="absolute mt-1 bg-white border rounded-md shadow-lg w-full max-h-48 overflow-y-auto z-10 p-2">
                        {Object.keys(colors).map((a, i) => (
                            <label
                                key={i}
                                className="flex items-center gap-2 p-1 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selection.names.includes(a)}
                                    onChange={() => toggleActivity(a)}
                                />
                                <span>{a}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-10 text-gray-500">Loading…</div>
            )}

            {/* Graph */}
            {!loading && merged.length > 0 && (
                <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={merged}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickFormatter={d =>
                                    new Date(d).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })
                                }
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            {selection.names.map(name => (
                                <Line
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stroke={colors[name] || "#000"}
                                    dot={false}
                                    strokeWidth={2}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* No Data */}
            {!loading && merged.length === 0 && (
                <div className="text-center text-gray-500 font-medium py-6">
                    No data for the selected activities.
                </div>
            )}

            {/* Stats */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {selection.names.map(name => {
                    const s = stats[name];
                    if (!s) return null;

                    return (
                        <div
                            key={name}
                            className="p-4 rounded-xl border bg-gray-50 shadow space-y-1"
                        >
                            <div className="font-bold text-lg">{name}</div>
                            <div className="text-gray-600 text-sm">
                                Total: <span className="font-semibold">{formatTime(s.total)}</span>
                            </div>
                            <div className="text-gray-600 text-sm">
                                Avg/day: <span className="font-semibold">{formatTime(Number(s.average.toFixed(2)))}</span>
                            </div>
                            <div className="text-gray-600 text-sm">
                                Avg/week: <span className="font-semibold">{formatTime(Number((s.average * 7).toFixed(2)))}</span>
                            </div>
                            <div className="text-gray-600 text-sm">
                                Max/day: <span className="font-semibold">{formatTime(s.max)}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Combined row */}
                {selection.names.length > 1 && (
                    <div className="p-4 rounded-xl border bg-blue-50 shadow space-y-1">
                        <div className="font-bold text-lg">Total (All selected)</div>
                        <div className="text-gray-600 text-sm">
                            Total: <span className="font-semibold">{formatTime(combined.total)}</span>
                        </div>
                        <div className="text-gray-600 text-sm">
                            Avg/day: <span className="font-semibold">{formatTime(Number(combined.average.toFixed(2)))}</span>
                        </div>
                        <div className="text-gray-600 text-sm">
                            Avg/week: <span className="font-semibold">{formatTime(Number((combined.average * 7).toFixed(2)))}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
