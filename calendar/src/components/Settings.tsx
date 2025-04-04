import { useState } from "react";
import { ChromePicker } from "react-color";

const Settings = () => {
  const [theme, setTheme] = useState("light");
  const [activityColors, setActivityColors] = useState<{ [key: string]: string }>({
    Coding: "#6366F1",
    Reading: "#10B981",
  });

  const handleColorChange = (activity: string, color: string) => {
    setActivityColors((prev) => ({ ...prev, [activity]: color }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Theme Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Dark Mode</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={theme === "dark"}
            onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-all duration-300"></div>
          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-full transition-transform duration-300" />
        </label>
      </div>

      {/* Activity Colors */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Activity Colors</h2>
        {Object.keys(activityColors).map((activity) => (
          <div key={activity} className="flex items-center gap-4 mb-4">
            <span className="w-24">{activity}</span>
            <ChromePicker
              color={activityColors[activity]}
              onChange={(color) => handleColorChange(activity, color.hex)}
            />
          </div>
        ))}
      </div>

      {/* Add/Edit Activities (Placeholder) */}
      <div>
        <h2 className="text-lg font-semibold">Manage Activities</h2>
        <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
          Add New Activity
        </button>
      </div>

      {/* Export/Import Data */}
      <div>
        <h2 className="text-lg font-semibold">Data Management</h2>
        <button className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
          Export Data
        </button>
        <button className="bg-red-500 text-white p-2 rounded ml-2 hover:bg-red-600 transition">
          Reset Data
        </button>
      </div>
    </div>
  );
};

export default Settings;
