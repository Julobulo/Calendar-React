import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "../../utils/Card";
import { sortedActivitySummary, totalActivityTime } from "../constants/mockData";
import { HomeColors } from "../constants/HomeColors";
import { getHumanTimeFromMinutes } from "../../../utils/helpers";

export const TimeSpentPerActivity = () => {
    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-bold">📊 Time Spent Per Activity This Week</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={sortedActivitySummary}
                            dataKey="time"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({ name }) => name}
                        >
                            {sortedActivitySummary.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}-${entry.name}`}
                                    fill={HomeColors.activities[entry.name] || "#ccc"}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string, props) => {
                                const rank =
                                    sortedActivitySummary.findIndex((e) => e.name === props.payload.name) + 1;
                                const percentage = ((value / totalActivityTime) * 100).toFixed(1);
                                return [
                                    <>
                                        <div className="flex justify-between gap-2 font-medium">
                                            <span>{name} — #{rank}</span>
                                        </div>
                                        <div>{getHumanTimeFromMinutes(value)} ({percentage}%)</div>
                                    </>,
                                ];
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}