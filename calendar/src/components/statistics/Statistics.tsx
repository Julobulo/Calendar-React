import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import Spinner from "../utils/Spinner";
import { formatTime, getDiffBetweenTimes, getHumanTimeFromMinutes } from "../../utils/helpers";
import { format } from "date-fns";
import { Props } from "recharts/types/cartesian/Bar";
import 'react-calendar-heatmap/dist/styles.css';
import 'react-tooltip/dist/react-tooltip.css';
import LocationTravelGraph from "../utils/LocationMap";
import { useLifetimeActivity } from "../../hooks/statistics/useLifetimeActivity";
import { useEntryCountData } from "../../hooks/statistics/useEntryCountData";
import ActivityHeatmap from "./ActivityHeatmap";
import { useColors } from "../../hooks/useColors";
import { useLineGraphData } from "../../hooks/statistics/useLineGraphData";
import { LineGraphOverTime } from "./LineGraphOverTime";
import { useTimeBreakdownByDay } from "../../hooks/statistics/useTimeBreakdownByDay";

interface Location {
  name: string;
  lat: number;
  lng: number;
  date: string;
}

const Statistics = () => {
  const { colors } = useColors();
  const { data: lifetimeActivity, firstActivityDate, loading: lifetimeLoading } = useLifetimeActivity();
  const { entryCountData, heatmapLoading, heatmapType, setHeatmapType, selectedYear, setSelectedYear, maxCount } = useEntryCountData();
  const { lineGraphData, lineGraphSelected, setLineGraphSelected, lineGraphLoading } = useLineGraphData();
  const { timeBreakdownByDayData, timeBreakdownByDayLoading } = useTimeBreakdownByDay();

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
        <h2 className="text-xl font-bold">Total Time Spent on Activities {(!lifetimeLoading && (lifetimeActivity?.length ?? 0) > 0) && `(since ${format(firstActivityDate || "", "MMMM dd, yyyy")})`}</h2>
        {lifetimeLoading ? (
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

      <ActivityHeatmap
        entryCountData={entryCountData}
        loading={heatmapLoading}
        heatmapType={heatmapType}
        setHeatmapType={setHeatmapType}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        maxCount={maxCount}
      />

      <LineGraphOverTime
        lineGraphData={lineGraphData}
        lineGraphSelected={lineGraphSelected}
        setLineGraphSelected={setLineGraphSelected}
        loading={lineGraphLoading}
        colors={colors}
      />

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
