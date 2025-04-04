import { useState } from "react";
import { toast } from "react-toastify";
import Spinner from "./Spinner";

const Settings = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`${import.meta.env.VITE_API_URI}/settings/export`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "exported_data.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(error as string);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const file = event.target.files[0];
    if (file.type !== "application/json") {
      setImportError("Please upload a valid JSON file.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        setIsImporting(true);
        try {
          const data = JSON.parse(reader.result as string);
          const response = await fetch(`${import.meta.env.VITE_API_URI}/settings/import`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error("Failed to import data");
          }

          const result = await response.json();
          toast.success(result.message || "Data imported successfully!");
        } catch (error) {
          setImportError("Error importing data");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setImportError("Error reading the file");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Export/Import Data */}
      <div>
        <h2 className="text-lg font-semibold">Data Management</h2>

        {/* Export Button */}
        <button
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
          onClick={handleExport}
          disabled={isExporting}
        >
          {!isExporting ? "Export Data" : <Spinner /> }
        </button>

        {/* Import Button */}
        <div className="flex items-center space-x-2 mt-4">
          <label htmlFor="file-upload" className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:bg-blue-600 transition">
          {!isImporting ? "Import Data" : <Spinner /> }
          </label>
          <input
            type="file"
            id="file-upload"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
            disabled={isImporting}
          />
        </div>

        {/* Import Error Message */}
        {importError && <p className="text-red-500 mt-2">{importError}</p>}
      </div>
    </div>
  );
};

export default Settings;