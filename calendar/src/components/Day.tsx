import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserActivity } from "./Calendar";
import { getHumanTimeFromMinutes, isLightOrDark } from "../utils/helpers";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Spinner from "./Spinner";
import { toast } from "react-toastify";
import { MdDelete } from "react-icons/md";

const Day = () => {
    const [searchParams] = useSearchParams();
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    const day = Number(searchParams.get("day"));

    const [dayActivities, setDayActivities] = useState<UserActivity>();
    const [colors, setColors] = useState<Record<string, string>>({});
    const [reload, setReload] = useState(false);

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
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity?year=${year}&month=${month}&day=${day}`, {
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch activities: ${response.status}`);
            }
            const data: UserActivity[] = await response.json();
            setDayActivities(data[0]);
            setLoading(false);
        }
        fetchActivities();
    }, [year, month, day, reload]);

    const navigate = useNavigate();
    const handleClick = () => {
        if (window.innerWidth < 768) {
            navigate(`/calendar/day/details?year=${year}&month=${month}&day=${day}`);
        }
        else {
            setEventPopUp({ state: "add", activity: "", description: "" });
        }
    };

    const [selectedDate, setSelectedDate] = useState(new Date(year, month, day));
    const [currentMonth, setCurrentMonth] = useState(new Date(year, month, 1));

    const [eventPopUp, setEventPopUp] = useState<{ state: "add" | "edit"; activity: string; description: string }>({ state: "add", activity: "", description: "" });

    const [loading, setLoading] = useState(true);

    const handleEventFinish = async () => {
        if (eventPopUp.state === "add") {
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/new`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json", // Tell the server we're sending JSON
                },
                body: JSON.stringify({
                    year: year,
                    month: month,
                    day: day,
                    activity: eventPopUp.activity,
                    description: eventPopUp.description,
                }),
            });
            const data = await response.json();
            if (response.status !== 200) {
                toast.error(data.message);
                console.log(`the event wasn't successfully created`);
            }
            else {
                console.log(`message: ${JSON.stringify(data)}`);
                setEventPopUp({ state: "add", activity: "", description: "" });
                setReload(!reload);
            }
        }
    }

    const handleDelete = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/delete`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json", // Tell the server we're sending JSON
            },
            body: JSON.stringify({
                year: year,
                month: month,
                day: day,
                activity: eventPopUp.activity,
            }),
        });
        const data = await response.json();
        if (response.status !== 200) {
            toast.error(data.message);
            console.log(`the event wasn't successfully deleted`);
        }
        else {
            console.log(`message: ${JSON.stringify(data)}`);
            setEventPopUp({ state: "add", activity: "", description: "" });
            setReload(!reload);
        }
    }

    return (
        <div className="flex flex-col md:flex-row h-screen">
            {/* Events List */}
            <div className="w-full md:w-3/5 h-full overflow-y-auto p-4 bg-gray-100" onClick={handleClick}>
                <h2 className="text-xl font-bold mb-4">Events for {format(new Date(year, month, day), "EEEE, MMMM do yyyy")}</h2>
                {(dayActivities && !loading) && (
                    <div className="mt-2 flex flex-col space-y-1">
                        {dayActivities.entries.map((entry, index) => (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: colors[entry.activity] || "#ffffff", // Default color if no match found
                                }}
                                className={`text-xs ${isLightOrDark(colors[entry.activity]) ? 'text-black' : 'text-white'} rounded px-2 py-1`}
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent handleClick from running
                                    setEventPopUp({ state: "edit", activity: entry.activity, description: entry.description })
                                }}
                            >
                                {entry.activity} - {getHumanTimeFromMinutes(entry.duration)} - {entry.description}
                            </div>
                        ))}
                    </div>
                )}
                {loading && (
                    <div className="flex justify-center">
                        <Spinner />
                    </div>
                )}
            </div>

            {/* Calendar & Form (Hidden on mobile) */}
            <div className="hidden md:flex flex-col w-2/5 p-4 bg-white">
                {/* Simple Calendar */}
                <div className="p-4 border rounded mb-4">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            setSelectedDate(date!);
                            setCurrentMonth(date!); // Update the month when a date is selected
                            console.log(`new url: ${`/calendar/day?year=${date?.getFullYear()}&month=${date?.getMonth()}&day=${date?.getDate()}`}`);
                            navigate(`/calendar/day?year=${date?.getFullYear()}&month=${date?.getMonth()}&day=${date?.getDate()}`);
                        }}
                        captionLayout="dropdown"
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                    />
                </div>

                {/* Add Event Form */}
                <div className="p-4 border rounded">
                    <h3 className="text-lg font-semibold">{eventPopUp.state} event</h3>
                    <div>
                        <input type="text" placeholder="Activity" className="w-full p-2 border mb-2 rounded" value={eventPopUp.activity} onChange={(e) => { if (eventPopUp.state === "add") { setEventPopUp({ ...eventPopUp, activity: e.target.value }) } }} disabled={eventPopUp.state !== "add"} />
                        <textarea placeholder="Description" className="w-full p-2 border mb-2 rounded" value={eventPopUp.description} onChange={(e) => setEventPopUp({ ...eventPopUp, description: e.target.value })}></textarea>
                        {
                            (eventPopUp.state === "add") ?
                                (<button className="w-full p-2 bg-blue-500 text-white rounded" onClick={async () => { await handleEventFinish(); }}>{eventPopUp.state}</button>)
                                :
                                (<div className="flex gap-2">
                                    <button className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        onClick={async () => { await handleEventFinish(); }}>
                                        {eventPopUp.state}
                                    </button>
                                    <button className="w-12 h-10 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600"
                                        onClick={async () => { await handleDelete() }}>
                                        <MdDelete className="text-xl" />
                                    </button>
                                </div>)
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Day;