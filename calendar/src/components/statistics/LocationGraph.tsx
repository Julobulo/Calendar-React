interface Props {
  locations: { lat: number; lng: number; label: string }[];
}

const LocationGraph = ({ locations }: Props) => {
  if (!locations.length) return null;

  return (
    <div className="bg-white shadow rounded-2xl p-4 my-4">
      <h2 className="text-xl font-bold">Activity Locations</h2>
      <div className="mt-4 h-80 bg-gray-100 flex items-center justify-center">
        {/* Replace with your map library */}
        <p className="text-gray-500">Map showing {locations.length} locations</p>
      </div>
    </div>
  );
};

export default LocationGraph;
