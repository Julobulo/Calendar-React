import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Colors, UserActivity } from "../../utils/types";
import Spinner from "../utils/Spinner";
import { getDiffBetweenTimes, getHumanTimeFromMinutes } from "../../utils/helpers";

interface Props {
    timeBreakdownByDayLoading: boolean;
    timeBreakdownByDayData: UserActivity[];
    colors: Colors;
}

export const TimeBreakdownByDay = ({ timeBreakdownByDayData, timeBreakdownByDayLoading, colors }: Props) => {
    return (
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
              No data for this week yet. Start tracking data to see a graph here!
            </div>)
        )}
      </div>
    )
}