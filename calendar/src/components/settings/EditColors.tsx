import { Colors } from "../../utils/types";
import Spinner from "../utils/Spinner";

interface EditColorsProps {
  loading: boolean;
  colors: Colors;
  setColors: (colors: Colors) => void;
  saveColors: (colors: Colors) => Promise<void>;
}

const EditColors = ({ loading, colors, setColors, saveColors }: EditColorsProps) => {
  if (loading) {
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    );
  }

  const updateActivityColor = (activity: string, newColor: string) => {
    setColors({
      ...colors,
      activities: { ...colors.activities, [activity]: newColor },
    });
  };

  const updateNoteColor = (newColor: string) => {
    setColors({ ...colors, note: newColor });
  };

  const updateVariableColor = (variable: string, newColor: string) => {
    setColors({
      ...colors,
      variables: { ...colors.variables, [variable]: newColor },
    });
  };

  return (
    <div className="bg-white shadow rounded-2xl p-4 space-y-4 my-4">
      <h2 className="text-xl font-bold">🎨 Edit Colors</h2>

      {/* Activities */}
      <div className="flex flex-col">
        <label className="text-gray-700 font-bold">Activity Colors</label>
        <div className="mt-2">
          {Object.entries(colors.activities).map(([activity, color]) => (
            <div key={activity} className="flex items-center mb-2">
              <input
                type="color"
                value={color}
                onChange={(e) => updateActivityColor(activity, e.target.value)}
                className="w-10 h-10 mr-2"
              />
              <span className="text-sm">{activity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="flex flex-col">
        <label className="text-gray-700 font-bold">Note Color</label>
        <input
          type="color"
          value={colors.note}
          onChange={(e) => updateNoteColor(e.target.value)}
          className="w-10 h-10 mr-2"
        />
      </div>

      {/* Variables */}
      <div className="flex flex-col">
        <label className="text-gray-700 font-bold">Variable Colors</label>
        <div className="mt-2">
          {Object.entries(colors.variables).map(([variable, color]) => (
            <div key={variable} className="flex items-center mb-2">
              <input
                type="color"
                value={color}
                onChange={(e) => updateVariableColor(variable, e.target.value)}
                className="w-10 h-10 mr-2"
              />
              <span className="text-sm">{variable}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="pt-4">
        <button
          onClick={() => saveColors(colors)}
          disabled={loading}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
        >
          {loading ? "Saving..." : "Save Colors"}
        </button>
      </div>
    </div>
  );
};

export default EditColors;
