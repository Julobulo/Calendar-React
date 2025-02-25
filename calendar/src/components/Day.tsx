import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserActivity } from "./Calendar";
import { getHumanTimeFromMinutes, isLightOrDark } from "../utils/helpers";

const Day = () => {
    const [searchParams] = useSearchParams();
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const day = searchParams.get("day");

    const [dayActivities, setDayActivities] = useState<UserActivity>();
    const [colors, setColors] = useState<Record<string, string>>({});
    useEffect(() => {
        const fetchColors = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/colors`, {
                method: "GET",
                credentials: "include", // Include cookies in the request
            });
            if (!response.ok) {
                throw new Error("Failed to fetch colors");
            }
            const data = await response.json();
            setColors(data);
            console.log(`Colors: ${colors}`);
        };
        fetchColors();
    }, []);

    useEffect(() => {
        const fetchActivities = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity?year=${year}&month=${month}&day=${day}`, {
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch activities: ${response.status}`);
            }
            const data: UserActivity[] = await response.json();
            setDayActivities(data[0]);
            console.log(`data: ${JSON.stringify(data[0])}`);
        }
        fetchActivities();
    }, []);

    const navigate = useNavigate();
    const handleClick = () => {
        if (window.innerWidth < 768) {
            navigate(`/calendar/day/details?year=${year}&month=${month}&day=${day}`);
        }
        else {
            // make the form show up
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen" onClick={handleClick}>
            {/* Events List */}
            <div className="w-full md:w-3/5 h-full overflow-y-auto p-4 bg-gray-100">
                <h2 className="text-xl font-bold mb-4">Events for {year}-{month}-{day}</h2>
                {dayActivities && (
                    <div className="mt-2 flex flex-col space-y-1">
                        {dayActivities.entries.map((entry, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: colors[entry.activity] || "#ffffff", // Default color if no match found
                                }}
                                className={`text-xs ${isLightOrDark(colors[entry.activity]) ? 'text-black' : 'text-white'} rounded px-2 py-1`}
                            >
                                {entry.activity} - {getHumanTimeFromMinutes(entry.duration)} - {entry.description}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Calendar & Form (Hidden on mobile) */}
            <div className="hidden md:flex flex-col w-2/5 p-4 bg-white">
                {/* Simple Calendar */}
                <div className="p-4 border rounded mb-4">
                    <h3 className="text-lg font-semibold">Calendar</h3>
                    {/* Calendar mock */}
                    <div className="grid grid-cols-7 gap-1 text-center mt-2">
                        {Array.from({ length: 30 }, (_, i) => (
                            <button key={i} className="p-2 border rounded hover:bg-gray-200">
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Event Form */}
                <div className="p-4 border rounded">
                    <h3 className="text-lg font-semibold">Add Event</h3>
                    <form>
                        <input type="text" placeholder="Event Name" className="w-full p-2 border mb-2 rounded" />
                        <textarea placeholder="Event Description" className="w-full p-2 border mb-2 rounded"></textarea>
                        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">Add Event</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Day;