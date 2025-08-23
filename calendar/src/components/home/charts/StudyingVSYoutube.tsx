import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent } from "../../utils/Card";
import { compareActivities } from "../constants/mockData";

export const StudyingVSYoutube = () => (
    <Card>
      <CardContent>
        <h2 className="text-xl font-bold">📚 Studying vs YouTube (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={compareActivities}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: number, name: string) => [`${value}h`, name]} />
            <Legend />
            <Line type="monotone" dataKey="Study" stroke="#6366f1" />
            <Line type="monotone" dataKey="YouTube" stroke="#f43f5e" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
);
