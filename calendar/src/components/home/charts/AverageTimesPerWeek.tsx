import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent } from "../../utils/Card"
import { highestAvgPerWeek } from "../constants/mockData"
import { getHumanTimeFromMinutes } from "../../../utils/helpers"
import { HomeColors } from "../constants/HomeColors"

export const AverageTimesPerWeek = () => {
    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-bold mb-4">🏆 Average Times Per Week</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                        data={highestAvgPerWeek}
                        margin={{ left: 18 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="activity" />
                        <YAxis tickFormatter={(value) => getHumanTimeFromMinutes(value)} />
                        <Tooltip
                            formatter={(value: number) => getHumanTimeFromMinutes(value)}
                        />
                        <Bar
                            dataKey="avg"
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={false}
                        >
                            {highestAvgPerWeek.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={HomeColors.activities[entry.activity] || "#4f46e5"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}