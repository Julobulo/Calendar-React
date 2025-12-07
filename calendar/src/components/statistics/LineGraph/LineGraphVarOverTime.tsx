import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useState } from "react";

interface Props {
    data: Record<string, { date: Date; value: number }[]>;
    stats: Record<string, { average: number; total: number }>;
    selection: { type: "activity" | "variable"; names: string[]; range: string };
    setSelection: (s: any) => void;
    loading: boolean;
    colors: Record<string, string>;
}

export default function LineGraphVariable({
    data,
    stats,
    selection,
    setSelection,
    loading,
    colors,
}: Props) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Build merged dataset for Recharts
    const merged: any[] = [];
    const allDates = new Set<string>();

    Object.values(data).forEach(list =>
        list.forEach(d => allDates.add(d.date.toISOString()))
    );

    const sortedDates = [...allDates].sort();

    sortedDates.forEach(dateStr => {
        const entry: any = { date: new Date(dateStr).toLocaleDateString() };
        for (const key of Object.keys(data)) {
            const found = data[key].find(e => e.date.toISOString() === dateStr);
            entry[key] = found?.value ?? 0;
        }
        merged.push(entry);
    });

    const toggleVar = (v: string) => {
        const already = selection.names.includes(v);
        setSelection({
            ...selection,
            names: already
                ? selection.names.filter(x => x !== v)
                : [...selection.names, v],
        });
    };

    const changeRange = (range: string) =>
        setSelection({ ...selection, range });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || payload.length === 0) return null;

        // Convert the label (which is the `date` string) back into a readable form
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
                    <div key={p.dataKey} className="flex justify-between" style={{ color: p.color }}>
                        <span>{p.dataKey}</span>
                        <span>{p.value}</span>
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="bg-white shadow rounded-2xl p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Variables Over Time</h2>

                {/* Time Range Select */}
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
                        ? "Select Variables..."
                        : selection.names.join(", ")}
                </button>

                {dropdownOpen && (
                    <div className="absolute mt-1 bg-white border rounded-md shadow-lg w-full max-h-48 overflow-y-auto z-10 p-2">
                        {Object.keys(colors).map((v, i) => (
                            <label key={i} className="flex items-center gap-2 p-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selection.names.includes(v)}
                                    onChange={() => toggleVar(v)}
                                />
                                <span>{v}</span>
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
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
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
                    No data for the selected variables.
                </div>
            )}

            {/* Stats */}
            <div className="space-y-2">
                {selection.names.map(name => {
                    const s = stats[name];
                    if (!s) return null;
                    return (
                        <div
                            key={name}
                            className="p-3 rounded-lg border bg-gray-50 flex justify-between"
                        >
                            <div>
                                <div className="font-semibold">{name}</div>
                                <div className="text-sm text-gray-600">
                                    Total: <strong>{s.total}</strong>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm text-gray-600">
                                    Average/day: <strong>{s.average.toFixed(2)}</strong>
                                </div>
                                <div className="text-sm text-gray-600">
                                    Average/week:{" "}
                                    <strong>{(s.average * 7).toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
