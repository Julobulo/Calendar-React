import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent } from "../../utils/Card"
import { mockActivities } from "../constants/mockData"
import { HomeColors } from "../constants/HomeColors"

export const ProgressOverTime = () => {
    return (
        <Card>
            <CardContent>
                <h2 className="text-xl font-bold mb-4">
                    📈 <span className="font-semibold">Weight</span> Progress Over Time
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={mockActivities
                            .filter((entry) =>
                                entry.variables.some((v) => v.variable === "Weight (kg)")
                            )
                            .map((entry) => ({
                                date: entry.date.toISOString().split("T")[0],
                                weight: parseFloat(
                                    entry.variables.find((v) => v.variable === "Weight (kg)")?.value!
                                ),
                            }))
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis unit="kg" />
                        <Tooltip formatter={(value) => `${value} kg`} />
                        <Line
                            type="monotone"
                            dataKey="weight"
                            stroke={HomeColors.variables["Weight (kg)"]}  // Use your color variable here
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}