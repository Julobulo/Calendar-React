import Spinner from "../utils/Spinner";
import { Colors } from "../../utils/types";
import { useState } from "react";
import { LineGraphZoomed } from "./lineGraphZoomed";
import { LineGraphOriginal } from "./lineGraphOriginal";

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
  const [showZoom, setShowZoom] = useState(false);

  return (
    <div className="bg-white shadow rounded-2xl p-4 space-y-8">
      <div className="w-full mb-3 flex justify-between items-center">
        <h2 className="text-xl font-bold">Activity / Variable Over Time {showZoom && "(Zoom)"}</h2>
        <select
          className="p-2 border rounded-md"
          value={lineGraphSelected?.name}
          onChange={(e) => {
            const value = e.target.value;
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
            {/* Line Graphs */}
            <div className="flex items-center justify-between mb-4">
            </div>
            {!showZoom ? (
              <LineGraphOriginal
                lineGraphData={lineGraphData}
                lineGraphSelected={lineGraphSelected}
                showAverageLineGraph={showAverageLineGraph}
                showTrendline={showTrendline}
              />) : (

              <LineGraphZoomed
                lineGraphData={lineGraphData}
                lineGraphSelected={lineGraphSelected}
                showAverageLineGraph={showAverageLineGraph}
                showTrendline={showTrendline}
              />
            )
            }


            {/* Controls */}
            <div>
              <div className="flex items-center gap-2 mb-4">
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
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="toggle-zoom"
                  type="checkbox"
                  checked={showZoom}
                  onChange={() => setShowZoom(prev => !prev)}
                  className="accent-blue-500 w-4 h-4"
                />
                <label htmlFor="toggle-zoom" className="text-sm text-gray-700">
                  Show zoom
                </label>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-xl font-semibold text-gray-500">
            No data for this {lineGraphSelected?.type || "activity"} recorded yet. Start tracking data for this {lineGraphSelected?.type || "activity"} to see data here!
          </div>
        )
      )}
    </div>
  )
}
