import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import { useUserLocations } from "../../hooks/statistics/useUserLocation";

export default function LocationTravelGraph() {
  const { stays, uniqueLocations } = useUserLocations();

  if (!stays.length) return null;

  // Build path only when location changes
  const path: [number, number][] = stays.map(s => [s.lat, s.lng]);

  // Center map roughly at first stay
  const center = [stays[0].lat, stays[0].lng] as [number, number];

  return (
    <div className="bg-white shadow rounded-2xl p-4 space-y-4 my-4">
      <h2 className="text-xl font-bold">Location Travel Graph</h2>
      <MapContainer center={center} zoom={3} scrollWheelZoom style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Lines connecting locations */}
        {path.length > 1 && <Polyline positions={path} pathOptions={{ color: "#3B82F6", weight: 3 }} />}

        {/* Markers */}
        {uniqueLocations.map((loc, i) => (
          <Marker key={i} position={[loc.lat, loc.lng]}>
            <Tooltip>{`${loc.name}: ${loc.count} day${loc.count > 1 ? 's' : ''}`}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
