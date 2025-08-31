import Spinner from "../utils/Spinner";

interface ImportButtonProps {
  isImporting: boolean;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  importError: string | null;
}

const ImportButton = ({ isImporting, onImport, importError }: ImportButtonProps) => {
  return (
    <div className="mt-4">
      <label
        htmlFor="file-upload"
        className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:bg-blue-600 transition block w-28 text-center"
      >
        {!isImporting ? "Import Data" : <Spinner />}
      </label>
      <input
        type="file"
        id="file-upload"
        accept="application/json"
        className="hidden"
        onChange={onImport}
        disabled={isImporting}
      />

      {importError && <p className="text-red-500 mt-2">{importError}</p>}
    </div>
  );
};

export default ImportButton;
