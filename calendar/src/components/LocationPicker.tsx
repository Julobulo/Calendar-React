import { format } from "date-fns";
import React, { useState, useEffect } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

interface Location {
    name: string;
    lat: number;
    lng: number;
}

interface LocationPickerProps {
    date: Date;
    selectedLocation: Location | null;
    onLocationChange: (location: Location) => void;
}

const ClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
    date,
    selectedLocation,
    onLocationChange,
}) => {
    const [inputValue, setInputValue] = useState("");
    const [savedLocations, setSavedLocations] = useState<Location[]>([]);
    const [osmSuggestions, setOsmSuggestions] = useState<Location[]>([]);
    const [showMenu, setShowMenu] = useState(false);
    const [currentPos, setCurrentPos] = useState<Location | null>(null);

    useEffect(() => {
        setSavedLocations([
            { name: "Home in Paris", lat: 48.8566, lng: 2.3522 },
            { name: "Home in NY", lat: 40.7128, lng: -74.006 },
        ]);
    }, []);

    useEffect(() => {
        const fetchOSMSuggestions = async () => {
            if (!inputValue.trim()) {
                setOsmSuggestions([]);
                return;
            }
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=json&limit=3`
            );
            const data = await res.json();
            setOsmSuggestions(
                data.map((entry: any) => ({
                    name: entry.display_name,
                    lat: parseFloat(entry.lat),
                    lng: parseFloat(entry.lon),
                }))
            );
        };

        const timeout = setTimeout(fetchOSMSuggestions, 300);
        return () => clearTimeout(timeout);
    }, [inputValue]);

    const handleSelectLocation = (location: Location) => {
        onLocationChange(location);
        setShowMenu(false);
    };

    const handleMapClick = (lat: number, lng: number) => {
        const newLocation: Location = {
            name: `Custom location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            lat,
            lng,
        };
        setCurrentPos(newLocation);
        onLocationChange(newLocation);
    };

    return (
        <div className="relative">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{format(date, "EEEE, MMMM do yyyy")}</h2>
                <button
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                    onClick={() => setShowMenu((prev) => !prev)}
                >
                    <FaLocationDot />
                    {selectedLocation ? selectedLocation.name : "Set location"}
                </button>
            </div>

            {showMenu && (
                <div className="mt-2 bg-white border shadow-xl rounded-lg w-full max-w-3xl flex">
                    <div className="w-1/2 p-4 space-y-4">
                        <input
                            type="text"
                            placeholder="Search for a location"
                            className="w-full p-2 border rounded"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />

                        <div>
                            <h4 className="font-bold text-sm text-gray-500 mb-1">Saved Locations</h4>
                            {savedLocations.map((loc, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectLocation(loc)}
                                    className="block text-left w-full p-1 hover:bg-gray-100 rounded"
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>

                        <div>
                            <h4 className="font-bold text-sm text-gray-500 mt-4 mb-1">OpenStreetMap</h4>
                            {osmSuggestions.map((loc, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectLocation(loc)}
                                    className="block text-left w-full p-1 hover:bg-gray-100 rounded"
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-1/2 p-4">
                        <MapContainer
                            center={[currentPos ? currentPos.lat : selectedLocation?.lat ?? 48.8566, currentPos ? currentPos.lng : selectedLocation?.lng ?? 2.3522]}
                            zoom={13}
                            scrollWheelZoom={false}
                            className="h-64 w-full rounded-lg"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <ClickHandler onClick={handleMapClick} />
                            {selectedLocation && (
                                <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                                    <Popup>Selected location</Popup>
                                </Marker>
                            )}
                            {currentPos && (
                                <Marker position={[currentPos.lat, currentPos.lng]}>
                                    <Popup>
                                        Current location: <pre>{JSON.stringify(currentPos, null, 2)}</pre>
                                    </Popup>
                                </Marker>
                            )}
                        </MapContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
