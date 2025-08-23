import Spinner from "../utils/Spinner";

interface ExportButtonProps {
  isExporting: boolean;
  onExport: () => void;
}

const ExportButton = ({ isExporting, onExport }: ExportButtonProps) => {
  return (
    <button
      className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
      onClick={onExport}
      disabled={isExporting}
    >
      {!isExporting ? "Export Data" : <Spinner />}
    </button>
  );
};

export default ExportButton;
