import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "../../utils/Card";
import { allActivityNames, chartData, mockActivities } from "../constants/mockData";
import { getDiffBetweenTimes, getHumanTimeFromMinutes } from "../../../utils/helpers";
import { HomeColors } from "../constants/HomeColors";

export const TimeBreakdownByDay = () => {
    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-bold">🧱 Time Breakdown by Day</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="day" />
                        {/* <YAxis /> */}
                        <YAxis
                            ticks={(() => {
                                const maxDailyMinutes = Math.max(
                                    ...mockActivities.map((activity) =>
                                        activity.entries.reduce((sum, entry) => sum + getDiffBetweenTimes(entry.start || "00:00", entry.end || "00:00"), 0)
                                    )
                                );

                                const maxHours = Math.ceil(maxDailyMinutes / 60);
                                return Array.from({ length: maxHours + 1 }, (_, i) => i * 60);
                            })()}
                            tickFormatter={(value: number) => `${(value / 60).toFixed(0)}h`}
                        />
                        <Tooltip formatter={(duration: number, activity: string) => [getHumanTimeFromMinutes(duration), activity]} />
                        <Legend />
                        {allActivityNames.map((name) => (
                            <Bar
                                key={name}
                                dataKey={name}
                                stackId="a"
                                fill={HomeColors.activities[name]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}