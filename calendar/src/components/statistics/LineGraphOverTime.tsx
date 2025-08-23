import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Spinner from "../utils/Spinner";
import { format } from "date-fns";
import { formatTime } from "../../utils/helpers";
import { Colors } from "../../utils/types";
import { useState } from "react";

interface Props {
  lineGraphData: any[];
  lineGraphSelected: { type: "activity" | "variable", name: string };
  setLineGraphSelected: (val: { type: "activity" | "variable", name: string }) => void;
  loading: boolean;
  colors: Colors;
}

export const LineGraphOverTime = ({
  lineGraphData,
  lineGraphSelected,
  setLineGraphSelected,
  loading,
  colors,
}: Props) => {
  const [showAverageLineGraph, setShowAverageLineGraph] = useState(false);
  const [showTrendline, setShowTrendline] = useState(false);

  return (
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

      {loading ? (
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
                {showTrendline && (
                  <Line
                    type="monotone"
                    dataKey="trendlineValue"
                    stroke="#00b894"
                    strokeWidth={2}
                    dot={false} // smooth line only
                    connectNulls={true} // skips the 0s
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-2 mb-4">
              {/* Show average per day/week select button */}
              <input
                id="toggle-average"
                type="checkbox"
                checked={showAverageLineGraph}
                //   onChange={() => setShowAverageLineGraph((prev) => !prev)}
                onChange={() => setShowAverageLineGraph(prev => !prev)}
                className="accent-blue-500 w-4 h-4"
              />
              <label htmlFor="toggle-average" className="text-sm text-gray-700">
                Show average per day and week
              </label>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                id="toggle-trendline"
                type="checkbox"
                checked={showTrendline}
                onChange={() => setShowTrendline(prev => !prev)}
                className="accent-blue-500 w-4 h-4"
              />
              <label htmlFor="toggle-trendline" className="text-sm text-gray-700">
                Show trendline (ignoring zeros)
              </label>
            </div>

          </>
        ) : (<div className="text-center text-xl font-semibold text-gray-500">
          No data for this {lineGraphSelected?.type || "activity"} recorded yet. Start tracking data for this {lineGraphSelected?.type || "activity"} to see data here!
        </div>)
      )}
    </div>
  )
}