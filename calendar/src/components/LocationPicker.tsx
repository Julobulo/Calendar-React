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
    onLocationChange: (location: Location) => void;
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
    }, []);

    useEffect(() => {
        const filterSavedLocations = () => {
            if (!inputValue.trim()) {
                setFilteredSavedLocations(savedLocations.slice(0, 3));
                return;
            }
            const filtered = matchSorter(savedLocations, inputValue, { keys: ["name"] });
            setFilteredSavedLocations(filtered);
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

    return (
        <div className="relative">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{format(date, "EEEE, MMMM do yyyy")}</h2>
                <button
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                    onClick={() => setShowMenu((prev) => !prev)}
                >
                    {isSavingLocation ? <Spinner /> :
                        (<>
                            <FaLocationDot />
                            {selectedLocation ? selectedLocation.name : "Set location"}
                        </>)}
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
