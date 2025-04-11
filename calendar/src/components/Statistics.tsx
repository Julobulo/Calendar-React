import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, CartesianGrid, Line } from "recharts";
import Spinner from "./Spinner";
import { formatTime } from "../utils/helpers";
import { format } from "date-fns";
import { Props } from "recharts/types/cartesian/Bar";
import CalendarHeatmap, { ReactCalendarHeatmapValue, TooltipDataAttrs } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface DailyActivity {
  date: string;
  count: number;
}

const Statistics = () => {
  const [lifetimeActivity, setLifetimeActivity] = useState<{ activity: string, totalTime: number }[]>([]);
  const [firstActivityDate, setFirstActivityDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState<{
    activities: { [activity: string]: string };
    note: string;
    variables: { [variable: string]: string };
  }>({ activities: {}, note: "", variables: {} });
  const [dailyActivityData, setDailyActivityData] = useState<DailyActivity[]>([]);
  const [maxCount, setMaxCount] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dataLineGraph, setDataLineGraph] = useState([
    {
      "time": 40,
      "date": "2024-01-03T00:00:00.000Z"
    },
    {
      "time": 75,
      "date": "2024-01-04T00:00:00.000Z"
    },
    {
      "time": 30,
      "date": "2024-01-05T00:00:00.000Z"
    },
    {
      "time": 60,
      "date": "2024-01-06T00:00:00.000Z"
    },
    {
      "time": 90,
      "date": "2024-01-07T00:00:00.000Z"
    },
    {
      "time": 30,
      "date": "2024-01-08T00:00:00.000Z"
    },
    {
      "time": 100,
      "date": "2024-01-09T00:00:00.000Z"
    },
    {
      "time": 120,
      "date": "2024-01-10T00:00:00.000Z"
    },
    {
      "time": 120,
      "date": "2024-01-11T00:00:00.000Z"
    },
    {
      "time": 180,
      "date": "2024-01-12T00:00:00.000Z"
    },
    {
      "time": 120,
      "date": "2024-01-13T00:00:00.000Z"
    },
    {
      "time": 180,
      "date": "2024-01-14T00:00:00.000Z"
    },
    {
      "time": 180,
      "date": "2024-01-15T00:00:00.000Z"
    },
    {
      "time": 30,
      "date": "2024-01-16T00:00:00.000Z"
    },
    {
      "time": 60,
      "date": "2024-01-17T00:00:00.000Z"
    },
    {
      "time": 70,
      "date": "2024-01-18T00:00:00.000Z"
    },
    {
      "time": 20,
      "date": "2024-01-22T00:00:00.000Z"
    },
    {
      "time": 20,
      "date": "2024-01-23T00:00:00.000Z"
    },
    {
      "time": 180,
      "date": "2024-02-12T00:00:00.000Z"
    },
    {
      "time": 90,
      "date": "2024-02-13T00:00:00.000Z"
    },
    {
      "time": 90,
      "date": "2024-02-14T00:00:00.000Z"
    },
    {
      "time": 100,
      "date": "2024-02-15T00:00:00.000Z"
    },
    {
      "time": 120,
      "date": "2024-02-16T00:00:00.000Z"
    },
    {
      "time": 120,
      "date": "2024-02-17T00:00:00.000Z"
    },]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URI}/statistics/daily-activity-count`, {
          method: "GET",
          credentials: "include", // Include cookies in the request
        });
        if (!response.ok) {
          toast.error("Failed to fetch activity data");
        }
        const data: { data: DailyActivity[] } = await response.json();
        setDailyActivityData(data.data);
        setMaxCount(Math.max(...data.data.map(d => d.count), 10));
        setLoading(false);
      } catch (err) {
        toast.error("There was an error fetching the data.");
        setLoading(false);
      }
    };

    fetchData();
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
            <div className="mt-10 w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lifetimeActivity}
                    dataKey="totalTime"
                    nameKey="activity"
                    cx="50%"
                    cy="50%"
                    // outerRadius={100}
                    outerRadius={"80%"}
                    labelLine={false}
                  >
                    {lifetimeActivity.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          colors.activities[entry.activity] ||
                          ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"][index % 6]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload && payload.length ? (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-semibold">
                            #{lifetimeActivity.findIndex((a) => a.activity === payload[0].payload.activity) + 1}{" "}
                            {payload[0].payload.activity}
                          </p>
                          <p>
                            {formatTime(payload[0].value as number)} (
                            {(
                              (payload[0].value as number /
                                lifetimeActivity.reduce((acc, cur) => acc + cur.totalTime, 0)) *
                              100
                            ).toFixed(1)}
                            %)
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Activity Heatmap</h2>
              <div className="flex justify-center items-center mb-4">
                <button
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className="px-2 mx-2 py-1 text-sm bg-gray-100 rounded-l"
                >
                  &lt;
                </button>
                <span className="text-lg font-semibold">{selectedYear}</span>
                <button
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  className="px-2 mx-2 py-1 text-sm bg-gray-100 rounded-l"
                >
                  &gt;
                </button>
              </div>
              <CalendarHeatmap
                startDate={new Date(selectedYear, 0, 1)}
                endDate={new Date(selectedYear, 11, 31)}
                values={dailyActivityData}
                classForValue={(value: ReactCalendarHeatmapValue<string> | undefined) => {
                  if (!value || !value.count) return 'fill-gray-200';
                  const intensity = value.count / maxCount; // 0 → 1
                  if (intensity < 0.2) return 'fill-green-200';
                  if (intensity < 0.4) return 'fill-green-300';
                  if (intensity < 0.6) return 'fill-green-400';
                  if (intensity < 0.8) return 'fill-green-500';
                  return 'fill-green-600';
                }}
                tooltipDataAttrs={(value: ReactCalendarHeatmapValue<string> | undefined): TooltipDataAttrs => {
                  if (!value || !(value as DailyActivity).date) {
                    return { 'data-tooltip-id': '', 'data-tooltip-content': '' } as TooltipDataAttrs;
                  }
                  const { date, count } = value as DailyActivity;
                  return {
                    'data-tooltip-id': 'heatmap-tooltip',
                    'data-tooltip-content': `${date}: ${count} activit${count === 1 ? 'y' : 'ies'}`,
                  } as TooltipDataAttrs;
                }}
              />

              <ReactTooltip id="heatmap-tooltip" /> {/* attaches to all elements with data-tooltip-id="heatmap-tooltip" */}
            </div>
            <div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dataLineGraph.map(item => ({
                  ...item,
                  date: format(new Date(item.date), "yyyy-MM-dd")  // clean x-axis
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="time" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Statistics;
