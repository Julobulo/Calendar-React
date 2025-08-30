import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatTime } from "../../utils/helpers";

interface Props {
    lineGraphData: any[];
    lineGraphSelected: { type: "activity" | "variable", name: string };
    showAverageLineGraph: boolean;
    showTrendline: boolean;
}

export const LineGraphZoomed = ({ lineGraphData, lineGraphSelected, showAverageLineGraph, showTrendline }: Props) => {
    // Compute min non-zero value for zoomed chart
    const minNonZeroValue = Math.min(
        ...lineGraphData.map(d => d.value).filter(v => v > 0)
    );
    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={lineGraphData
                .filter(item => item.value > 0) // remove 0 values here
                .map(item => ({
                    ...item,
                    date: format(new Date(item.date), "yyyy-MM-dd")
                }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[minNonZeroValue, "auto"]} />
                <Tooltip content={({ payload }) => {
                    if (payload && payload.length) {
                        const { value, date, average } = payload[0].payload;
                        return (
                            <div className="bg-white p-2 border rounded shadow-lg">
                                <p>{lineGraphSelected?.type} - {lineGraphSelected?.name.split("-")[1]}</p>
                                <p>{lineGraphSelected?.type === "activity" ? formatTime(value) : value}</p>
                                <p>{format(new Date(date), "MMMM dd, yyyy")}</p>
                                {showAverageLineGraph && (
                                    <>
                                        <p>Avg/day: {lineGraphSelected?.type === "activity" ? formatTime(average) : average}</p>
                                        <p>Avg/week: {lineGraphSelected?.type === "activity" ? formatTime(average * 7) : average * 7}</p>
                                    </>
                                )}
                            </div>
                        );
                    }
                    return null;
                }} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
                {showAverageLineGraph && <Line type="monotone" dataKey="average" stroke="#ff0000" />}
                {showTrendline && (
                    <Line
                        type="monotone"
                        dataKey="trendlineValue"
                        stroke="#00b894"
                        strokeWidth={2}
                        dot={false}
                        connectNulls={true}
                    />
                )}
            </LineChart>
        </ResponsiveContainer>
    )
}