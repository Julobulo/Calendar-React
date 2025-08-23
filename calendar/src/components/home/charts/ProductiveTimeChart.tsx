import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "../../utils/Card";
import { FaRegClock } from "react-icons/fa";

const data = [
  { day: "Mon", Productive: 3, Unproductive: 2 },
  { day: "Tue", Productive: 4, Unproductive: 1.5 },
  { day: "Wed", Productive: 5, Unproductive: 2 },
  { day: "Thu", Productive: 2.5, Unproductive: 3 },
  { day: "Fri", Productive: 3, Unproductive: 2.5 },
  { day: "Sat", Productive: 1.5, Unproductive: 4 },
  { day: "Sun", Productive: 2, Unproductive: 3.5 }
];

export const ProductiveTimeChart = () => (
  <Card>
    <CardContent>
      <div className="flex items-center mb-3">
        <FaRegClock className="text-3xl mr-2" />
        <h3 className="text-xl font-bold">Unproductive vs Productive Time</h3>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip formatter={(v: number) => `${v}h`} />
          <Legend />
          <Bar dataKey="Productive" stackId="a" fill="#10b981" />
          <Bar dataKey="Unproductive" stackId="a" fill="#f43f5e" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
