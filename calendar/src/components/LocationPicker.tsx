import { format } from "date-fns";
import React, { useState, useEffect } from "react";
import { FaLocationDot } from "react-icons/fa6";

// Types
interface Location {
    name: string;
    lat: number;
    lng: number;
}

interface LocationPickerProps {
    date: Date,
    selectedLocation: Location | null;
    onLocationChange: (location: Location) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
    date,
    selectedLocation,
    onLocationChange,
}) => {
    const [inputValue, setInputValue] = useState("");
    const [savedLocations, setSavedLocations] = useState<Location[]>([]);
    const [osmSuggestions, setOsmSuggestions] = useState<Location[]>([]);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        // Load saved locations (stub example)
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
                    {/* Left: Input + Suggestions */}
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

                    {/* Right: Map display (basic map with Leaflet or placeholder) */}
                    <div className="w-1/2 p-4">
                        {/* TODO: Replace with a real map component like react-leaflet */}
                        <div className="bg-gray-200 w-full h-64 flex items-center justify-center text-gray-500">
                            [Map showing pin at selected location]
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
