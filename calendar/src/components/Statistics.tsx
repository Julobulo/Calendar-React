import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Spinner from "./Spinner";
import { formatTime } from "../utils/helpers";
import { format } from "date-fns";
import { Props } from "recharts/types/cartesian/Bar";


const Statistics = () => {
  const [lifetimeActivity, setLifetimeActivity] = useState<{ activity: string, totalTime: number }[]>([]);
  const [firstActivityDate, setFirstActivityDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState<{
    activities: { [activity: string]: string };
    note: string;
    variables: { [variable: string]: string };
  }>({ activities: {}, note: "", variables: {} });

  useEffect(() => {
    const fetchLifetimeActivity = async () => {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URI}/statistics/lifetime-activity`, {
        method: "GET",
        credentials: "include", // Include cookies in the request
      });
      if (!response.ok) {
        toast.error(`Failed to fetch lifetime activity: ${(await response.json()).message}`);
        setLoading(false);
      }
      const data = await response.json();
      setLifetimeActivity(data.activities);
      setFirstActivityDate(data.firstActivityDate ? new Date(data.firstActivityDate).toLocaleDateString() : null);
      setLoading(false);
    };
    fetchLifetimeActivity();
  }, []);

  useEffect(() => {
    const fetchColors = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/colors`, {
        method: "GET",
        credentials: "include", // Include cookies in the request
      });
      if (!response.ok) {
        toast.error(`Failed to fetch colors: ${(await response.json()).message}`);
        setLoading(false);
      }
      const data = await response.json();
      setColors(data);
    };
    fetchColors();
  }, []);

  return (
    <div className="p-0 md:p-10">
      {loading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
      {
        !loading && (
          <div>
            {(lifetimeActivity?.length ?? 0) > 0 ? (<><h2 className="text-lg font-semibold mb-2">Total Time Spent on Activities (since {format(firstActivityDate || "", "MMMM dd, yyyy")})</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lifetimeActivity}>
                  <XAxis dataKey="activity" />
                  <YAxis />
                  <Tooltip
                    content={({ payload }) => {
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
                    }}
                  />
                  <Bar
                    dataKey="totalTime"
                    shape={(props: Props) => {
                      const { x, y, width, height, index } = props;
                      const activity = lifetimeActivity[Number(index)]?.activity;
                      const color = colors.activities[activity] || "#6366F1"; // Default color
                      return <rect x={x} y={y} width={width} height={height} fill={color} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer></>) : (
              <div className="text-center text-xl font-semibold text-gray-500">
                No activities recorded yet. Start tracking your activities to see data here!
              </div>
            )}
          </div>
        )
      }
    </div>
  );
};

export default Statistics;
