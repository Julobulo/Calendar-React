import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Spinner from "../utils/Spinner";
import { format } from "date-fns";
import { formatTime } from "../../utils/helpers";

interface Props {
  data: { activity: string; totalTime: number }[];
  colors: { [activity: string]: string };
  firstActivityDate: string | null;
  loading: boolean;
}

const LifetimeActivityGraph = ({ data, colors, firstActivityDate, loading }: Props) => {
  if (loading) {
    return <div className="flex justify-center"><Spinner /></div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center text-xl font-semibold text-gray-500">
      No activities recorded yet. Start tracking your activities to see data here!
    </div>;
  }

  return (
    <div className="bg-white shadow rounded-2xl p-4 space-y-4 my-4">
      <h2 className="text-xl font-bold">
        Total Time Spent on Activities {firstActivityDate && `(since ${format(new Date(firstActivityDate), "MMMM dd, yyyy")})`}
      </h2>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="activity" />
          <YAxis />
          <Tooltip content={({ payload }) => {
            if (payload && payload.length) {
              const { activity, totalTime } = payload[0].payload;
              return (
                <div className="bg-white p-2 border rounded shadow-lg">
                  <p>{activity}</p>
                  <p>{formatTime(totalTime)}</p>
                </div>
              );
            }
            return null;
          }} />
          <Bar
            dataKey="totalTime"
            shape={({ x, y, width, height, index }: typeof Bar.arguments.shape) => {
              const activity = data[index!]?.activity;
              const color = colors[activity] || "#6366F1";
              return <rect x={x} y={y} width={width} height={height} fill={color} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Pie chart */}
      <div className="mt-10 w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="totalTime" nameKey="activity" outerRadius="80%" labelLine={false}>
              {data.map((entry, index) => (
                <Cell key={index} fill={colors[entry.activity] || "#4F46E5"} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const { activity, totalTime } = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="font-semibold">{activity}</p>
                      <p>{formatTime(totalTime)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LifetimeActivityGraph;
