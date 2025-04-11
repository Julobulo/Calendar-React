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
  const [lineGraphData, setLineGraphData] = useState<{ date: Date, value: number | null }[]>([]);

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

  const [lineGraphSelected, setLineGraphSelected] = useState<{ type: "activity" | "variable", name: string } | null>(null);
  const [lineGraphLoading, setLineChartLoading] = useState<boolean>(false);

  const fetchLineGraphData = async () => {
    if (!lineGraphData) return;
    setLineChartLoading(true);
    try {
      console.log(`debugging: ${JSON.stringify({ type: lineGraphSelected?.type, name: lineGraphSelected?.name })}`);
      const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/line-graph`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: lineGraphSelected?.type, name: lineGraphSelected?.name.split("-")[1] }),
      });
      const json = await res.json();
      setLineGraphData(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err?.toString());
    }
    setLineChartLoading(false);
  };

  useEffect(() => {
    fetchLineGraphData();
  }, [lineGraphSelected]);

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
            <div className="bg-white shadow rounded-2xl p-4 space-y-4">
              <div className="w-full mb-3 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Activity / Variable Over Time</h2>
                <select
                  className="p-2 border rounded-md"
                  value={lineGraphSelected?.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Set the type dynamically based on the selected option (activity/variable)
                    const newSelection : {type: "activity" | "variable", name: string} = {
                      type: value.startsWith('activity') ? 'activity' : 'variable',
                      name: value,
                    };
                    console.log(`newSelection: ${JSON.stringify(newSelection)}`);
                    setLineGraphSelected(newSelection);
                  }}
                >
                  <option value="Select...">Select Activity/Variable</option>
                  <optgroup label="Activities">
                    {Object.keys(colors.activities).map((activity, index) => (
                      <option key={index} value={`activity-${activity}`}>
                        {activity}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Variables">
                    {Object.keys(colors.variables).map((variable, index) => (
                      <option key={index} value={`variable-${variable}`}>
                        {variable}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {lineGraphLoading ? (
                <Spinner />
              ) : (
                (lineGraphData?.length ?? 0) > 0 ? (<ResponsiveContainer width="100%" height={400}>
                  <LineChart data={lineGraphData.map(item => ({
                    ...item,
                    date: format(new Date(item.date), "yyyy-MM-dd")
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>) : (<div className="text-center text-xl font-semibold text-gray-500">
                  No data for this {lineGraphSelected?.type || "activity"} recorded yet. Start tracking data for this {lineGraphSelected?.type || "activity"} to see data here!
                </div>)
              )}
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Statistics;
