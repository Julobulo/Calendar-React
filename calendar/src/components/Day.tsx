import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserActivity } from "../utils/helpers";
import { getHumanTimeFromMinutes, isLightOrDark } from "../utils/helpers";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Spinner from "./Spinner";
import { toast } from "react-toastify";
import { MdDelete } from "react-icons/md";
import { FaRegCalendarTimes } from "react-icons/fa";

const Day = () => {
    const [searchParams] = useSearchParams();
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    const day = Number(searchParams.get("day"));

    const [dayActivities, setDayActivities] = useState<UserActivity>();
    const [colors, setColors] = useState<Record<string, string>>({});
    const [names, setNames] = useState<Array<string>>([]);
    const [reload, setReload] = useState(false);

    const [mobileShowForm, setMobileShowForm] = useState<boolean>(false);

    useEffect(() => {
        const fetchColors = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/colors`, {
                method: "GET",
                credentials: "include", // Include cookies in the request
            });
            if (!response.ok) {
                toast.error("Failed to fetch colors");
            }
            const data = await response.json();
            setColors(data);
        };
        fetchColors();
    }, [reload]);

    useEffect(() => {
        const fetchNames = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/names`, {
                method: "GET",
                credentials: "include", // Include cookies in the request
            });
            if (!response.ok) {
                toast.error("Failed to fetch names");
            }
            const data = await response.json();
            setNames(data);
        };
        fetchNames();
    }, [reload]);

    const highlightTimesAndNames = (description: string): string => {
        let newDescription;
        const timeRegex = /(\d{1,2})h\s*(\d{1,2})?min?|\b(\d{1,2})min\b|\b(\d{1,2})h\b/g;
        newDescription = description.replace(timeRegex, (match) => {
            return `<span style="text-decoration: underline;">${match}</span>`;
        });
        return newDescription.replace(/@([a-zA-Z]*)$/, (match) => {
            return `<span style="font-weight: bold;">${match}</span>`;
        });
    };

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity?year=${year}&month=${month}&day=${day}`, {
                credentials: "include"
            });
            if (!response.ok) {
                toast.error(`Failed to fetch activities: ${response.status}`);
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
            // navigate(`/calendar/day/details?year=${year}&month=${month}&day=${day}`);
            setMobileShowForm(true);
            setEventPopUp({ state: "add", activity: "", description: "" });
        }
        else {
            setEventPopUp({ state: "add", activity: "", description: "" });
        }
    };

    const [selectedDate, setSelectedDate] = useState(new Date(year, month, day));
    const [currentMonth, setCurrentMonth] = useState(new Date(year, month, 1));


    useEffect(() => {
        localStorage.setItem('day', selectedDate.getDate().toString());
        localStorage.setItem('month', selectedDate.getMonth().toString());
        localStorage.setItem('year', selectedDate.getFullYear().toString());
    }, [selectedDate])

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
                setEventPopUp({ state: "add", activity: "", description: "" });
                setReload(!reload);
            }
        }
        else if (eventPopUp.state === "edit") {
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/edit`, {
                method: "PATCH",
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
                console.log(`the event wasn't successfully edited`);
            }
            else {
                setEventPopUp({ state: "add", activity: "", description: "" });
                setReload(!reload);
            }
        }
        setMobileShowForm(false);
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
            setEventPopUp({ state: "add", activity: "", description: "" });
            setReload(!reload);
        }
        setMobileShowForm(false);
    }

    const calendarRef = useRef<HTMLDivElement>(null);
    const [calendarWidth, setCalendarWidth] = useState<number | null>(null);

    useEffect(() => {
        if (calendarRef.current) {
            setCalendarWidth(calendarRef.current.offsetWidth);
        }
    }, []);

    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState<number>(0);

    const suggestionsTypeRef = useRef<"activity" | "name" | "">("");

    const setSuggestionsType = (value: "activity" | "name" | "") => {
        suggestionsTypeRef.current = value;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const value = e.target.value;
        let filteredSuggestions: Array<string> = [];
        if (suggestionsTypeRef.current === "activity") {
            setEventPopUp((prev) => ({ ...prev, activity: value }));

            if (value.length === 0) {
                setSuggestions([]);
                return;
            }

            filteredSuggestions = Object.keys(colors)
                .filter((key) => key.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 3);
        }
        else if (suggestionsTypeRef.current === "name") {
            setEventPopUp((prev) => ({ ...prev, description: value }));

            if (value.length === 0) {
                setSuggestions([]);
                return;
            }
            const cursorPos = e.target.selectionStart || 0;
            setCursorPosition(cursorPos);
            const textBeforeCursor = value.slice(0, cursorPos);
            const match = textBeforeCursor.match(/@([a-zA-Z]*)$/);

            if (match) {
                filteredSuggestions = names
                    .filter((name: string) => name.toLowerCase().includes(match[1].toLowerCase()))
                    .slice(0, 3);
            }
        }

        setSuggestions(filteredSuggestions);
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (suggestionsTypeRef.current === "activity") {
            setEventPopUp((prev) => ({ ...prev, activity: suggestion }));
        }
        else if (suggestionsTypeRef.current === "name") {
            const textBeforeCursor = eventPopUp.description.slice(0, cursorPosition);
            setEventPopUp((prev) => ({ ...prev, description: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestion}`) + eventPopUp.description.slice(cursorPosition) }));
        }
        setSuggestions([]);
    };

    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault(); // Prevents the cursor from moving
            setSelectedSuggestionIndex((prev) =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            if (selectedSuggestionIndex !== -1) e.preventDefault(); // Prevents the cursor from moving
            if (selectedSuggestionIndex > 0) {
                setSelectedSuggestionIndex((prevIndex) => prevIndex - 1);
              } else {
                // Stop selecting suggestions if already at the top
                setSelectedSuggestionIndex(-1);
              }
        } else if (e.key === "Enter" && selectedSuggestionIndex !== -1) {
            e.preventDefault(); // Prevents the cursor from moving
            if (suggestionsTypeRef.current === "activity") {
                setEventPopUp((prev) => ({ ...prev, activity: suggestions[selectedSuggestionIndex] }));
            }
            else if (suggestionsTypeRef.current === "name") {
                const textBeforeCursor = eventPopUp.description.slice(0, cursorPosition);
                setEventPopUp((prev) => ({ ...prev, description: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestions[selectedSuggestionIndex]}`) + eventPopUp.description.slice(cursorPosition) }));
            }
            setSuggestions([]);
            setSelectedSuggestionIndex(-1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            setSuggestions([]);
        }
    };

    const handleClose = () => {
        setMobileShowForm(false);
    }

    return (
        <div className="flex flex-col md:flex-row h-screen p-3">
            {/* Events List */}
            {((window.innerWidth < 768 && !mobileShowForm) || (window.innerWidth >= 768)) && (<div className="w-full h-full overflow-y-auto p-4 bg-gray-100" onClick={handleClick}>
                <h2 className="text-xl font-bold mb-4">Events for {format(new Date(year, month, day), "EEEE, MMMM do yyyy")}</h2>
                {loading && (
                    <div className="flex justify-center">
                        <Spinner />
                    </div>
                )}
                {!loading && dayActivities && (
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
                                    setMobileShowForm(true);
                                }}
                            >
                                {entry.activity} - {getHumanTimeFromMinutes(entry.duration)} - <span dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(entry.description) }}></span>
                            </div>
                        ))}
                    </div>
                )}
                {!loading && !dayActivities && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm p-2">
                        <FaRegCalendarTimes className="text-lg" />
                        No activities recorded for today.
                    </div>
                )
                }
            </div>)}

            {/* Calendar & Form (Hidden on mobile) */}
            {((window.innerWidth < 768 && mobileShowForm) || (window.innerWidth >= 768)) && (<div className="md:inline-flex flex-col px-4 bg-white max-w-fit">
                {/* Simple Calendar */}
                <div ref={calendarRef} className="p-4 border rounded mb-4 w-max ">
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                            if (!date) return; // Prevent clearing the date
                            setSelectedDate(date!);
                            setCurrentMonth(date!); // Update the month when a date is selected
                            navigate(`/calendar/day?year=${date?.getFullYear()}&month=${date?.getMonth()}&day=${date?.getDate()}`);
                        }}
                        captionLayout="dropdown"
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                    />
                </div>

                {/* Add Event Form */}
                <div className="p-4 border rounded mr-0 lg:mr-2 xl:mr-14" style={{ width: calendarWidth ? `${calendarWidth}px` : "auto" }}>
                    <h3 className="text-lg font-semibold">{eventPopUp.state} event</h3>
                    <div>
                        <input type="text" placeholder="Activity, e.g. Running" className="w-full p-2 border rounded" value={eventPopUp.activity}
                            // onChange={(e) => { if (eventPopUp.state === "add") { setEventPopup((prev) => ({ ...eventPopUp, activity: e.target.value }) } }}
                            onChange={(e) => { setSuggestionsType("activity"); handleInputChange(e) }}
                            onKeyDown={handleKeyDown}
                            disabled={eventPopUp.state !== "add"} />
                        {suggestions.length > 0 && suggestionsTypeRef.current === "activity" && (
                            <ul className="bg-white border rounded shadow-lg">
                                {suggestions.map((suggestion, index) => (
                                    <li
                                        key={suggestion}
                                        className={`p-2 cursor-pointer ${index === selectedSuggestionIndex ? "bg-gray-300" : "hover:bg-gray-200"
                                            }`}
                                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                        onMouseLeave={() => setSelectedSuggestionIndex(-1)}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion.split("").map((char, index) => (
                                            <span key={index} className={eventPopUp.activity.toLowerCase().includes(char.toLowerCase()) ? "bg-purple-300" : ""}>
                                                {char}
                                            </span>
                                        ))}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <textarea
                            placeholder="Description, e.g. 1h22min morning run, followed by a 15min evening run"
                            className="w-full p-2 border mt-2 rounded"
                            value={eventPopUp.description}
                            onChange={(e) => { setSuggestionsType("name"); handleInputChange(e) }}
                            onKeyDown={handleKeyDown}></textarea>
                        {suggestions.length > 0 && suggestionsTypeRef.current === "name" && (
                            <ul className="bg-white border rounded shadow-lg">
                                {suggestions.map((suggestion, index) => {
                                    const textBeforeCursor = eventPopUp.description.slice(0, cursorPosition);
                                    const match = textBeforeCursor.match(/@([a-zA-Z]*)$/);
                                    return <li
                                        key={suggestion}
                                        className={`p-2 cursor-pointer ${index === selectedSuggestionIndex ? "bg-gray-300" : "hover:bg-gray-200"
                                            }`}
                                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                                        onMouseLeave={() => setSelectedSuggestionIndex(-1)}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion.split("").map((char, index) => (
                                            <span key={index} className={match?.[1].toLowerCase().includes(char.toLowerCase()) ? "bg-purple-300" : ""}>
                                                {char}
                                            </span>
                                        ))}
                                    </li>
                                })}
                            </ul>
                        )}
                        {
                            (eventPopUp.state === "add") ?
                                (<button className="w-full p-2 bg-blue-500 text-white rounded mt-2" onClick={async () => { await handleEventFinish(); }}>{eventPopUp.state}</button>)
                                :
                                (<div className="flex gap-2 mt-2">
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
                <button onClick={handleClose} className="absolute top-2 right-2 text-gray-600 block md:hidden">✕</button>
            </div>)}
        </div>
    );
};

export default Day;