import { useExportSettings } from "../../hooks/settings/useExportSettings";
import { useImportSettings } from "../../hooks/settings/useImportSettings";
import ExportButton from "./ExportButton";
import ImportButton from "./ImportButton";

const Settings = () => {
  const { isExporting, handleExport } = useExportSettings();
  const { isImporting, importError, handleImport } = useImportSettings();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Export/Import Data */}
      <div>
        <h2 className="text-lg font-semibold">Data Management</h2>
        <ExportButton isExporting={isExporting} onExport={handleExport} />
        <ImportButton
          isImporting={isImporting}
          onImport={handleImport}
          importError={importError}
        />
      </div>
    </div>
  );
};

export default Settings;