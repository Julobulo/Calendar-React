import { format } from "date-fns";
import React, { useState, useEffect, useRef } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { matchSorter } from "match-sorter";
import { toast } from "react-toastify";
import Spinner from "./Spinner";

interface Location {
    name: string;
    lat: number;
    lng: number;
}

interface LocationPickerProps {
    date: Date;
    selectedLocation: Location | null;
    onLocationChange: (location: Location | null) => void;
    isSavingLocation: boolean;
}

const ClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
    useMapEvents({
        click(e: any) {
            onClick(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
};

const MapCenterer: React.FC<{ center: [number, number] | null }> = ({ center }) => {
    const map = useMap();
    const prevCenter = useRef<string | null>(null);

    useEffect(() => {
        if (center) {
            const centerKey = `${center[0]}-${center[1]}`;
            if (centerKey !== prevCenter.current) {
                map.setView(center);
                prevCenter.current = centerKey;
            }
        }
    }, [center, map]);

    return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
    date,
    selectedLocation,
    onLocationChange,
    isSavingLocation,
}) => {
    const [inputValue, setInputValue] = useState("");
    const [savedLocations, setSavedLocations] = useState<Location[]>([]);
    const [filteredSavedLocations, setFilteredSavedLocations] = useState<Location[]>([]);
    const [osmSuggestions, setOsmSuggestions] = useState<Location[]>([]);
    const [showMenu, setShowMenu] = useState(false);
    const [reloadSavedLocations, setReloadSavedLocations] = useState<boolean>(false);

    useEffect(() => {
        const fetchSavedLocations = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URI}/location/savedLocations`, {
                method: "GET",
                credentials: "include", // Include cookies in the request
            });
            if (!response.ok) {
                toast.error(`Failed to fetch saved locations: ${(await response.json()).message}`);
            }
            const data: Location[] = await response.json();
            setSavedLocations(data);
        };
        fetchSavedLocations();
    }, [reloadSavedLocations]);

    useEffect(() => {
        const filterSavedLocations = () => {
            if (!inputValue.trim()) {
                setFilteredSavedLocations([]);
                return;
            }
            const filtered = matchSorter(savedLocations, inputValue, { keys: ["name"] });
            setFilteredSavedLocations(filtered.slice(0, 3));
        };

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

        filterSavedLocations();
        const timeout = setTimeout(fetchOSMSuggestions, 300);
        return () => clearTimeout(timeout);
    }, [inputValue, savedLocations]);

    const handleSelectLocation = (location: Location) => {
        onLocationChange(location);
        setInputValue("");
        setOsmSuggestions([]);
        if (!savedLocations.some((loc) => loc.name === location.name)) {
            setShowSavePrompt(location);
        }
    };

    const handleMapClick = (lat: number, lng: number) => {
        const newLocation: Location = {
            name: `Custom location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            lat,
            lng,
        };
        onLocationChange(newLocation);
    };

    const mapCenter: [number, number] | null = selectedLocation
        ? [selectedLocation.lat, selectedLocation.lng]
        : null;

    const [showSavePrompt, setShowSavePrompt] = useState<Location | null>(null);

    return (
        <div className="relative">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{format(date, "EEEE, MMMM do yyyy")}</h2>
                <div className="flex items-center gap-1">
                    <button
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                        onClick={() => setShowMenu((prev) => !prev)}
                    >
                        {isSavingLocation ? (
                            <Spinner />
                        ) : selectedLocation ? (
                            <>
                                <FaLocationDot />
                                <span>{selectedLocation.name}</span>
                            </>
                        ) : (
                            <>
                                <FaLocationDot />
                                Set location
                            </>
                        )}
                    </button>
                    {selectedLocation && <button
                        onClick={async (e) => {
                            e.stopPropagation(); // prevent opening the menu
                            onLocationChange(null); // clear location
                            const res = await fetch(`${import.meta.env.VITE_API_URI}/location/dayLocation/delete`, {
                                method: "DELETE",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({year: date.getFullYear(), month: date.getMonth(), day: date.getDate(), })
                            });
                            if (!res.ok) {
                                toast.error("Failed to delete location for this day.");
                            }
                        }}
                        className="ml-1 text-gray-400 hover:text-red-500 hover:no-underline"
                        title="Clear location"
                    >
                        ❌
                    </button>}
                </div>
            </div>
            {showSavePrompt && (
                <div className="bg-white shadow-lg border rounded p-3 flex flex-col gap-2 w-full">
                    <span className="text-sm">
                        💾 Save this location?
                    </span>
                    <input
                        type="text"
                        value={showSavePrompt.name}
                        onChange={(e) =>
                            setShowSavePrompt((prev) =>
                                prev ? { ...prev, name: e.target.value } : prev
                            )
                        }
                        className="p-2 border rounded text-sm"
                        placeholder="Location name"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            className="text-blue-600 hover:underline text-sm"
                            onClick={async () => {
                                const res = await fetch(`${import.meta.env.VITE_API_URI}/location/newLocation`, {
                                    method: "POST",
                                    credentials: "include",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(showSavePrompt)
                                });
                                if (!res.ok) {
                                    toast.error("Failed to save location.");
                                }
                                setShowSavePrompt(null);
                                setReloadSavedLocations(!reloadSavedLocations);
                            }}
                        >
                            Save
                        </button>
                        <button
                            className="text-gray-500 hover:underline text-sm"
                            onClick={() => setShowSavePrompt(null)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
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
                            {filteredSavedLocations.map((loc, idx) => (
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
                            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [48.8566, 2.3522]}
                            zoom={13}
                            scrollWheelZoom={true}
                            className="h-64 w-full rounded-lg"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <ClickHandler onClick={handleMapClick} />
                            {mapCenter && <MapCenterer center={mapCenter} />}
                            {selectedLocation && (
                                <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                                    <Popup>Selected location</Popup>
                                </Marker>
                            )}
                        </MapContainer>
                    </div>
                </div>
            )}
        </div>
    );
};
