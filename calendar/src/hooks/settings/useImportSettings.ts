import { useState } from "react";
import { toast } from "react-toastify";

export function useImportSettings() {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

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
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
          });

          if (!response.ok) throw new Error("Failed to import data");

          const result = await response.json();
          toast.success(result.message || "Data imported successfully!");
          setImportError(null);
        } catch {
          setImportError("Error importing data");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    } catch {
      setImportError("Error reading the file");
    }
  };

  return { isImporting, importError, handleImport };
}
