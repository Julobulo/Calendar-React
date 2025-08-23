import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, CartesianGrid, Line, Legend } from "recharts";
import Spinner from "../utils/Spinner";
import { formatTime, getDiffBetweenTimes, getHumanTimeFromMinutes } from "../../utils/helpers";
import { format } from "date-fns";
import { Props } from "recharts/types/cartesian/Bar";
import CalendarHeatmap, { ReactCalendarHeatmapValue, TooltipDataAttrs } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import Cookies from "js-cookie";
import LocationTravelGraph from "../utils/LocationMap";
import { UserActivity } from "../../utils/types";

interface DailyActivity {
  date: string;
  count: { activityCount: number, variableCount: number, note: 0 | 1 };
}

interface Location {
  name: string;
  lat: number;
  lng: number;
  date: string;
}

const Statistics = () => {
  const [lifetimeActivity, setLifetimeActivity] = useState<{ activity: string, totalTime: number }[]>([]);
  const [firstActivityDate, setFirstActivityDate] = useState<string | null>(null);
  const [colors, setColors] = useState<{
    activities: { [activity: string]: string };
    note: string;
    variables: { [variable: string]: string };
  }>({ activities: {}, note: "", variables: {} });
  const [entryCountData, setEntryCountData] = useState<DailyActivity[]>([]);
  const [maxCount, setMaxCount] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [lineGraphData, setLineGraphData] = useState<{ date: Date, value: number | null }[]>([]);
  const [heatmapType, setHeatmapType] = useState<"all" | "activities" | "variables" | "notes">("all");
  const [heatmapLoading, setHeatmapLoading] = useState<boolean>(false);

  const [lifetimeActivityLoading, setLifetimeActivityLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchLifetimeActivity = async () => {
      setLifetimeActivityLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URI}/statistics/lifetime-activity`, {
        method: "GET",
        credentials: "include", // Include cookies in the request
      });
      if (!response.ok) {
        toast.error(`Failed to fetch lifetime activity: ${(await response.json()).message}`);
        setLifetimeActivityLoading(false);
        return
      }
      const data = await response.json();
      if (!data.activities || !Array.isArray(data.activities)) { toast.error(`Invalid data format for lifetime activity graphs`); setLifetimeActivityLoading(false); return }
      setLifetimeActivity(data.activities);
      setFirstActivityDate(data.firstActivityDate ? new Date(data.firstActivityDate).toLocaleDateString() : null);
      setLifetimeActivityLoading(false);
    };
    if (Cookies.get('token')) fetchLifetimeActivity();
  }, []);

  useEffect(() => {
    const fetchColors = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/colors`, {
        method: "GET",
        credentials: "include", // Include cookies in the request
      });
      if (!response.ok) {
        toast.error(`Failed to fetch colors: ${(await response.json()).message}`);
        return
      }
      const data = await response.json();
      if (!data || typeof data !== "object") { toast.error(`no data or bad data type for colors`); return }
      setColors(data);
      const firstActivity = Object.keys(data.activities)[0];
      const firstVariable = Object.keys(data.variables)[0];
      if (firstActivity) {
        setLineGraphSelected({ type: "activity", name: `activity-total` });
      } else if (firstVariable) {
        setLineGraphSelected({ type: "variable", name: `variable-${firstVariable}` });
      }
    };
    if (Cookies.get('token')) fetchColors();
  }, []);

  useEffect(() => {
    const fetchEntryCountData = async () => {
      setHeatmapLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URI}/statistics/daily-activity-count`, {
          method: "GET",
          credentials: "include", // Include cookies in the request
        });
        if (!response.ok) {
          toast.error(`Failed to fetch activity data: ${(await response.json()).message}`);
          return
        }
        const data: DailyActivity[] = await response.json();
        setEntryCountData(data);
        setMaxCount(Math.max(...data.map(d => d.count.activityCount + d.count.variableCount + d.count.note), 10));
      } catch (err) {
        toast.error("There was an error fetching the data.");
      } finally { setHeatmapLoading(false) }
    };

    if (Cookies.get('token')) fetchEntryCountData();
  }, []);

  const [lineGraphSelected, setLineGraphSelected] = useState<{ type: "activity" | "variable", name: string }>({
    type: "activity",
    name: "activity-total",
  });
  const [lineGraphLoading, setLineGraphLoading] = useState<boolean>(false);
  const [showAverageLineGraph, setShowAverageLineGraph] = useState<boolean>(false);

  const fetchLineGraphData = async () => {
    if (!lineGraphSelected) return;
    setLineGraphLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/statistics/line-graph`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: lineGraphSelected?.type, name: lineGraphSelected?.name.split("-")[1] }),
      });
      if (!response.ok) {
        toast.error(`Failed to fetch line graph data: ${(await response.json()).message}`);
        setLineGraphLoading(false);
        return
      }
      const json = await response.json();
      // setLineGraphData(json.data || []);
      const rawData: { date: string; value: number | null }[] = json.data || [];

      // Convert date strings to Date objects
      const parsedData = rawData.map(entry => ({
        date: new Date(entry.date),
        value: entry.value ?? 0,
      }));

      // Find min and max dates (by converting to timestamps)
      const timestamps = parsedData.map(entry => entry.date.getTime());
      const minDate = new Date(Math.min(...timestamps));
      // const maxDate = new Date(Math.max(...timestamps));
      const maxDate = new Date();

      // Generate all dates in the range
      const allDates: Date[] = [];
      const current = new Date(minDate);
      while (current <= maxDate) {
        // Set the time to 12:00:00 to ensure consistency
        current.setHours(12, 0, 0, 0);
        allDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      // Map existing dates to strings for easier lookup
      const dataMap = new Map(parsedData.map(d => [d.date.toISOString().split("T")[0], d.value]));

      // Fill in missing dates
      const filledData = allDates.map(date => {
        const key = date.toISOString().split("T")[0];
        return {
          date,
          value: dataMap.has(key) ? dataMap.get(key)! : 0,
        };
      });

      // setLineGraphData(filledData);

      // 1. Calculate average (ignoring nulls if needed)
      const total = filledData.reduce((sum, entry) => sum + (Number(entry.value) ?? 0), 0);
      const count = filledData.filter(entry => entry.value !== null).length;
      const average = count > 0 ? total / count : 0;

      // 2. Add average to each data point
      const withAverage = filledData.map(entry => ({
        ...entry,
        average,
      }));

      setLineGraphData(withAverage);
    } catch (err) {
      console.error(err);
      toast.error(err?.toString());
    }
    setLineGraphLoading(false);
  };

  useEffect(() => {
    if (Cookies.get('token')) fetchLineGraphData();
  }, [lineGraphSelected]);

  const [timeBreakdownByDayLoading, setTimeBreakdownByDayLoading] = useState(false);
  const [timeBreakdownByDayData, setTimeBreakdownByDayData] = useState<UserActivity[]>([]);

  useEffect(() => {
    const fetchLatestWeekData = async () => {
      setTimeBreakdownByDayLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URI}/statistics/latest-week-data`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        toast.error(`Failed to fetch time breakdown by day graph data: ${(await response.json()).message}`);
        setTimeBreakdownByDayLoading(false);
        return
      }
      setTimeBreakdownByDayLoading(false);
      const json = await response.json();
      // Convert mockActivities into chart-friendly format

      setTimeBreakdownByDayData(json.map((activityDocument: UserActivity) => {
        const day = new Date(activityDocument.date).toLocaleDateString("en-US", { weekday: "short" });
        const dayData: any = { day };

        for (const entry of activityDocument?.entries || []) {
          if (getDiffBetweenTimes(entry.start || "", entry.end || "") > 0) {
            dayData[entry.activity] = getDiffBetweenTimes(entry.start || "", entry.end || "");
            // if (entry.activity === "Studying") console.log(`entry.activity: ${entry.activity}, entry.duration: ${entry.duration}, dayData[entry.activity]: ${dayData[entry.activity]}`)
          }
        }

        return dayData;
      }))
    }

    if (Cookies.get('token')) fetchLatestWeekData();
  }, [])

  const [locations, setLocations] = useState<
    Location[]
  >([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/getAllLocations`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) return;

      const data: Location[] = await res.json();

      setLocations(data);
    };

    fetchLocations();
  }, []);

  return (
    <div className="p-0 md:p-10">
      <div className="bg-white shadow rounded-2xl p-4 space-y-4 my-4">
        <h2 className="text-xl font-bold">Location travel graph</h2>
        <LocationTravelGraph locations={locations} />
      </div>

      <div className="bg-white shadow rounded-2xl p-4 space-y-4 my-4">
        <h2 className="text-xl font-bold">Total Time Spent on Activities {(!lifetimeActivityLoading && (lifetimeActivity?.length ?? 0) > 0) && `(since ${format(firstActivityDate || "", "MMMM dd, yyyy")})`}</h2>
        {lifetimeActivityLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (lifetimeActivity?.length ?? 0) > 0 ? (
          <>
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
            </ResponsiveContainer>
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
          </>) : (
          <div className="text-center text-xl font-semibold text-gray-500">
            No activities recorded yet. Start tracking your activities to see data here!
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-2xl p-4 space-y-4 my-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Activity Heatmap</h2>
          <select
            className="p-2 border rounded-md"
            value={heatmapType}
            onChange={(e) => setHeatmapType(e.target.value as "all" | "activities" | "variables" | "notes")}
          >
            <option value="all">All Entries</option>
            <option value="activities">Activities</option>
            <option value="variables">Variables</option>
            <option value="notes">Notes</option>
          </select>
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
        </div>
        {heatmapLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          <CalendarHeatmap
            startDate={new Date(selectedYear, 0, 1)}
            endDate={new Date(selectedYear, 11, 31)}
            values={entryCountData ?? []}
            classForValue={(value: ReactCalendarHeatmapValue<string> | undefined) => {
              let count = 0;
              if (heatmapType === "all" || heatmapType === "activities") count += value?.count.activityCount
              if (heatmapType === "all" || heatmapType === "variables") count += value?.count.variableCount
              if (heatmapType === "all" || heatmapType === "notes") count += value?.count.note
              if (!value || !count) return 'fill-gray-200';
              const intensity = count / maxCount; // 0 → 1
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
              let entriesCount = 0;
              if (heatmapType === "all" || heatmapType === "activities") entriesCount += value?.count.activityCount
              if (heatmapType === "all" || heatmapType === "variables") entriesCount += value?.count.variableCount
              if (heatmapType === "all" || heatmapType === "notes") entriesCount += value?.count.note
              if (!entriesCount) return { 'data-tooltip-id': '', 'data-tooltip-content': '' } as TooltipDataAttrs

              let label = '';
              if (heatmapType === 'all') {
                label = `entr${entriesCount === 1 ? 'y' : 'ies'}`;
              } else if (heatmapType === 'activities') {
                label = `activit${entriesCount === 1 ? 'y' : 'ies'}`;
              } else if (heatmapType === 'variables') {
                label = `variable${entriesCount === 1 ? '' : 's'}`;
              } else if (heatmapType === 'notes') {
                label = `note${entriesCount === 1 ? '' : 's'}`;
              }

              return {
                'data-tooltip-id': 'heatmap-tooltip',
                'data-tooltip-content': `${value.date}: ${entriesCount} ${label}`,
              } as TooltipDataAttrs;
            }}
          />)}
        <ReactTooltip id="heatmap-tooltip" /> {/* attaches to all elements with data-tooltip-id="heatmap-tooltip" */}
      </div>

      <div className="bg-white shadow rounded-2xl p-4 space-y-4">
        <div className="w-full mb-3 flex justify-between items-center">
          <h2 className="text-xl font-bold">Activity / Variable Over Time</h2>
          <select
            className="p-2 border rounded-md"
            value={lineGraphSelected?.name}
            onChange={(e) => {
              const value = e.target.value;
              // Set the type dynamically based on the selected option (activity/variable)
              const newSelection: { type: "activity" | "variable", name: string } = {
                type: value.startsWith('activity') ? 'activity' : 'variable',
                name: value,
              };
              setLineGraphSelected(newSelection);
            }}
          >
            <option value="Select...">Select Activity/Variable</option>
            <optgroup label="Activities">
              <option value="activity-total">Total (All Activities)</option>
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
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          (lineGraphData?.length ?? 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lineGraphData.map(item => ({
                  ...item,
                  date: format(new Date(item.date), "yyyy-MM-dd")
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={({ payload }) => {
                    if (payload && payload.length) {
                      if (lineGraphSelected?.type === "activity") {
                        const { value, date, average } = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border rounded shadow-lg">
                            <p>{lineGraphSelected?.type} - {lineGraphSelected?.name.split("-")[1]}</p>
                            <p>{formatTime(value)}</p>
                            <p>{format(date, "MMMM dd, yyyy")}</p>
                            {showAverageLineGraph && (<><p>Avg/day: {formatTime(average)}</p>
                              <p>Avg/week: {formatTime(average * 7)}</p></>)}
                          </div>
                        );
                      } else if (lineGraphSelected?.type === "variable") {
                        const { value, date, average } = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border rounded shadow-lg">
                            <p>{lineGraphSelected?.type} - {lineGraphSelected?.name.split("-")[1]}</p>
                            <p>{value}</p>
                            <p>{date}</p>
                            {showAverageLineGraph && (<><p>Avg/day: {average}</p>
                              <p>Avg/week: {average * 7}</p></>)}
                          </div>
                        );
                      }
                    }
                    return null;
                  }} />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
                  {showAverageLineGraph && <Line type="monotone" dataKey="average" stroke="#ff0000"
                  // strokeDasharray="5 5"
                  />}
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-2 mb-4">
                {/* Show average per day/week select button */}
                <input
                  id="toggle-average"
                  type="checkbox"
                  checked={showAverageLineGraph}
                  onChange={() => setShowAverageLineGraph(prev => !prev)}
                  className="accent-blue-500 w-4 h-4"
                />
                <label htmlFor="toggle-average" className="text-sm text-gray-700">
                  Show average per day and week
                </label>
              </div>
            </>
          ) : (<div className="text-center text-xl font-semibold text-gray-500">
            No data for this {lineGraphSelected?.type || "activity"} recorded yet. Start tracking data for this {lineGraphSelected?.type || "activity"} to see data here!
          </div>)
        )}
      </div>

      <div className="bg-white shadow rounded-2xl p-4 space-y-4 my-4">
        <h2 className="text-xl font-bold">🧱 Time Breakdown by Day</h2>
        {timeBreakdownByDayLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          (timeBreakdownByDayData?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeBreakdownByDayData}>
                <XAxis dataKey="day" />
                <YAxis
                  ticks={(() => {
                    const maxDailyMinutes = Math.max(
                      ...timeBreakdownByDayData.map((activity) =>
                        (activity?.entries || []).reduce((sum, entry) => sum + getDiffBetweenTimes(entry.start || "", entry.end || ""), 0)
                      )
                    );

                    const maxHours = Math.ceil(maxDailyMinutes / 60);
                    return Array.from({ length: maxHours + 1 }, (_, i) => i * 60);
                  })()}
                  tickFormatter={(value: number) => `${(value / 60).toFixed(0)}h`}
                />
                <Tooltip formatter={(duration: number, activity: string) => [getHumanTimeFromMinutes(duration), activity]} />
                <Legend />
                {
                  // Collect all activities across all days
                  (() => {
                    const allActivities = new Set<string>(); // Explicitly type as string
                    timeBreakdownByDayData.forEach((dayData) => {
                      Object.keys(dayData).forEach((key) => {
                        if (key !== "day") {
                          allActivities.add(key);
                        }
                      });
                    });

                    // Map over all activities and create a Bar for each
                    return Array.from(allActivities).map((name) => (
                      <Bar
                        key={name}
                        dataKey={name}
                        stackId="a"
                        fill={colors.activities[name] || "#8884d8"}
                      />
                    ));
                  })()
                }
              </BarChart>
            </ResponsiveContainer>)
            : (<div className="text-center text-xl font-semibold text-gray-500">
              No data for this {lineGraphSelected?.type || "activity"} recorded yet. Start tracking data for this {lineGraphSelected?.type || "activity"} to see data here!
            </div>)
        )}
      </div>
    </div>
  );
};

export default Statistics;
