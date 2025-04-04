
const Settings = () => {

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Export/Import Data */}
      <div>
        <h2 className="text-lg font-semibold">Data Management</h2>
        <button className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
          Export Data
        </button>
        <button className="bg-blue-500 text-white p-2 rounded ml-2 hover:bg-red-600 transition">
          Import Data
        </button>
      </div>

    </div>
  );
};

export default Settings;
