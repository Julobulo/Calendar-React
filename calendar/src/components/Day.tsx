import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { highlightTimesAndNames, UserActivity } from "../utils/helpers";
import { getHumanTimeFromMinutes, isLightOrDark } from "../utils/helpers";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Spinner from "./Spinner";
import { toast } from "react-toastify";
import { MdDelete } from "react-icons/md";
import { FaRegCalendarTimes } from "react-icons/fa";
import { LocationPicker } from "./LocationPicker";
import Cookies from "js-cookie";

interface Location {
    name: string;
    lat: number;
    lng: number;
}

const Day = () => {
    const [searchParams] = useSearchParams();
    const year = searchParams.get("year") !== null ? Number(searchParams.get("year")) : new Date().getFullYear();
    const month = searchParams.get("month") !== null ? Number(searchParams.get("month")) : new Date().getMonth();
    const day = searchParams.get("day") !== null ? Number(searchParams.get("day")) : new Date().getDate();
    // useEffect(() => {setSearchParams({ year: year.toString(), month: month.toString(), day: day.toString() })}, [year, month, day])

    const [dayActivities, setDayActivities] = useState<UserActivity>();
    const [colors, setColors] = useState<{
        activities: { [activity: string]: string };
        note: string;
        variables: { [variable: string]: string };
    }>({ activities: {}, note: "", variables: {} });
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
                toast.error(`Failed to fetch colors: ${(await response.json()).message}`);
                setLoading(false);
                return
            }
            const data = await response.json();
            setColors(data);
        };
        if (Cookies.get('token')) fetchColors();
    }, [reload]);

    useEffect(() => {
        const fetchNames = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/names`, {
                method: "GET",
                credentials: "include", // Include cookies in the request
            });
            if (!response.ok) {
                toast.error(`Failed to fetch names: ${(await response.json()).message}`);
                setLoading(false);
                return;
            }
            const data = await response.json();
            setNames(data);
        };
        if (Cookies.get('token')) fetchNames();
    }, [reload]);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity?year=${year}&month=${month}&day=${day}`, {
                credentials: "include"
            });
            if (!response.ok) {
                toast.error(`Failed to fetch activities: ${(await response.json()).message}`);
                setLoading(false);
                return;
            }
            const data: UserActivity[] = await response.json();
            const sortedActivities = data[0]?.entries.sort((a, b) => {
                const aHasTime = typeof a.time === "string";
                const bHasTime = typeof b.time === "string";
                if (aHasTime && bHasTime) {
                    // Compare times: "HH:MM"
                    return a.time!.localeCompare(b.time!);
                } else if (aHasTime) {
                    return -1; // a before b
                } else if (bHasTime) {
                    return 1; // b before a
                } else {
                    return 0; // both have no time
                }
            })
            if (data[0]) {setDayActivities({ ...data[0], entries: sortedActivities || [] })} else {setDayActivities(undefined)}
            setLoading(false);
        }
        if (Cookies.get('token')) fetchActivities();
    }, [year, month, day, reload]);

    const navigate = useNavigate();
    const handleClick = () => {
        if (window.innerWidth < 768) {
            setMobileShowForm(true);
            setEventPopUp({ state: "add", activity: "", description: "", time: new Date().toISOString().slice(11, 16), note: "", variable: "", value: "" });
        }
        else {
            setEventPopUp({ state: "add", activity: "", description: "", time: new Date().toISOString().slice(11, 16), note: "", variable: "", value: "" });
        }
    };

    const [selectedDate, setSelectedDate] = useState(new Date(year, month, day));
    const [currentMonth, setCurrentMonth] = useState(new Date(year, month, 1));


    useEffect(() => {
        localStorage.setItem('day', selectedDate.getDate().toString());
        localStorage.setItem('month', selectedDate.getMonth().toString());
        localStorage.setItem('year', selectedDate.getFullYear().toString());
    }, [selectedDate])

    const [eventPopUp, setEventPopUp] = useState<{ state: "add" | "edit"; activity: string; description: string, time: string, note: string, variable: string, value: string }>({ state: "add", activity: "", description: "", time: "", note: "", variable: "", value: "" });

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const handleEventFinish = async () => {
        if (!Cookies.get('token')) return
        if (eventPopUp.state === "add") {
            setActionLoading(true);
            let body;
            if (selectedForm === "activity") {
                if (!eventPopUp.activity || !eventPopUp.description) { toast.error('Please fill in both activity and description'); setActionLoading(false); return }
                body = {
                    year: year,
                    month: month,
                    day: day,
                    type: "activity",
                    activity: eventPopUp.activity,
                    description: eventPopUp.description,
                    time: eventPopUp.time,
                }
            } else if (selectedForm === "note") {
                if (!eventPopUp.note) { toast.error('Please fill in the note'); setActionLoading(false); return }
                body = {
                    year: year,
                    month: month,
                    day: day,
                    type: "note",
                    note: eventPopUp.note,
                }
            } else if (selectedForm === "variable") {
                if (!eventPopUp.variable || !eventPopUp.value) { toast.error('Please fill in both variable and value'); setActionLoading(false); return }
                body = {
                    year: year,
                    month: month,
                    day: day,
                    type: "variable",
                    variable: eventPopUp.variable,
                    value: eventPopUp.value,
                }
            }
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/new`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json", // Tell the server we're sending JSON
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (response.status !== 200) {
                toast.error(data.message);
                console.log(`the event wasn't successfully created`);
            }
            else {
                setEventPopUp({ state: "add", activity: "", description: "", time: "", note: "", variable: "", value: "" });
                setReload(!reload);
            }
            setActionLoading(false);
        }
        else if (eventPopUp.state === "edit") {
            setActionLoading(true);
            let body;
            if (selectedForm === "activity") {
                if (!eventPopUp.activity || !eventPopUp.description) { toast.error('Please fill in both activity and description'); setActionLoading(false); return }
                body = {
                    year: year,
                    month: month,
                    day: day,
                    type: "activity",
                    activity: eventPopUp.activity,
                    description: eventPopUp.description,
                    time: eventPopUp.time,
                }
            } else if (selectedForm === "note") {
                if (!eventPopUp.note) { toast.error('Please fill in the note'); setActionLoading(false); return }
                body = {
                    year: year,
                    month: month,
                    day: day,
                    type: "note",
                    note: eventPopUp.note,
                }
            } else if (selectedForm === "variable") {
                if (!eventPopUp.variable || !eventPopUp.value) { toast.error('Please fill in both variable and value'); setActionLoading(false); return }
                body = {
                    year: year,
                    month: month,
                    day: day,
                    type: "variable",
                    variable: eventPopUp.variable,
                    value: eventPopUp.value,
                }
            }
            const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/edit`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json", // Tell the server we're sending JSON
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (response.status !== 200) {
                toast.error(data.message);
                console.log(`the event wasn't successfully edited`);
            }
            else {
                setEventPopUp({ state: "add", activity: "", description: "", time: "", note: "", variable: "", value: "" });
                setReload(!reload);
            }
            setTimeout('', 5000);
            setActionLoading(false);
        }
        setMobileShowForm(false);
    }

    const handleDelete = async () => {
        setActionLoading(true);
        let body;
        if (selectedForm === "activity") {
            body = {
                year: year,
                month: month,
                day: day,
                type: "activity",
                activity: eventPopUp.activity,
            }
        } else if (selectedForm === "note") {
            body = {
                year: year,
                month: month,
                day: day,
                type: "note",
            }
        } else if (selectedForm === "variable") {
            body = {
                year: year,
                month: month,
                day: day,
                type: "variable",
                variable: eventPopUp.variable,
            }
        }
        const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/delete`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json", // Tell the server we're sending JSON
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (response.status !== 200) {
            toast.error(data.message);
            console.log(`the event wasn't successfully deleted`);
        }
        else {
            setEventPopUp({ state: "add", activity: "", description: "", time: "", note: "", variable: "", value: "" });
            setReload(!reload);
        }
        setMobileShowForm(false);
        setActionLoading(false);
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

    const suggestionsTypeRef = useRef<"activity" | "name" | "variable" | "">("");

    const setSuggestionsType = (value: "activity" | "name" | "variable" | "") => {
        suggestionsTypeRef.current = value;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const value = e.target.value;
        let filteredSuggestions: Array<string> = [];
        if (selectedForm === "activity") {
            if (suggestionsTypeRef.current === "activity") {
                setEventPopUp((prev) => ({ ...prev, activity: value }));

                if (value.length === 0) {
                    setSuggestions([]);
                    return;
                }

                filteredSuggestions = Object.keys(colors.activities)
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
        } else if (selectedForm === "note") {
            setEventPopUp((prev) => ({ ...prev, note: value }));
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
        } else if (selectedForm === "variable") {
            if (suggestionsTypeRef.current === "variable") {
                setEventPopUp((prev) => ({ ...prev, variable: value }));

                if (value.length === 0) {
                    setSuggestions([]);
                    return;
                }

                filteredSuggestions = Object.keys(colors.variables)
                    .filter((key) => key.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 3);
            }
            else if (suggestionsTypeRef.current === "name") {
                setEventPopUp((prev) => ({ ...prev, value: value }));
            }
        }

        setSuggestions(filteredSuggestions);
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (selectedForm === "activity") {
            if (suggestionsTypeRef.current === "activity") {
                setEventPopUp((prev) => ({ ...prev, activity: suggestion }));
            }
            else if (suggestionsTypeRef.current === "name") {
                const textBeforeCursor = eventPopUp.description.slice(0, cursorPosition);
                setEventPopUp((prev) => ({ ...prev, description: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestion}`) + eventPopUp.description.slice(cursorPosition) }));
            }
        } else if (selectedForm === "note") {
            const textBeforeCursor = eventPopUp.note.slice(0, cursorPosition);
            setEventPopUp((prev) => ({ ...prev, note: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestion}`) + eventPopUp.note.slice(cursorPosition) }));
        } else if (selectedForm === "variable") {
            setEventPopUp((prev) => ({ ...prev, variable: suggestion }));
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
            if (selectedForm === "activity") {
                if (suggestionsTypeRef.current === "activity") {
                    setEventPopUp((prev) => ({ ...prev, activity: suggestions[selectedSuggestionIndex] }));
                }
                else if (suggestionsTypeRef.current === "name") {
                    const textBeforeCursor = eventPopUp.description.slice(0, cursorPosition);
                    setEventPopUp((prev) => ({ ...prev, description: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestions[selectedSuggestionIndex]}`) + eventPopUp.description.slice(cursorPosition) }));
                }
            } else if (selectedForm === "note") {
                const textBeforeCursor = eventPopUp.note.slice(0, cursorPosition);
                setEventPopUp((prev) => ({ ...prev, note: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestions[selectedSuggestionIndex]}`) + eventPopUp.note.slice(cursorPosition) }));
            } else if (suggestionsTypeRef.current === "variable") {
                setEventPopUp((prev) => ({ ...prev, variable: suggestions[selectedSuggestionIndex] }));
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

    const [selectedForm, setSelectedForm] = useState<"activity" | "note" | "variable">("activity");

    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const isInitialLocationLoad = useRef(true);

    useEffect(() => {
        const setLocation = async () => {
            console.log(`setLocation is being run: ${selectedLocation?.name}`);
            if (isInitialLocationLoad.current) {
                console.log(`not going to set location because isIntialLocationLoad is true`)
                isInitialLocationLoad.current = false;
                return; // skip saving on initial load
            }
            if (!selectedLocation) {
                const res = await fetch(`${import.meta.env.VITE_API_URI}/location/dayLocation/delete`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ year: year, month: month, day: day, })
                });
                if (!res.ok) {
                    toast.error("Failed to delete location for this day.");
                    return;
                }
                return
            };

            setIsSavingLocation(true);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // Abort after 5s

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URI}/location/dayLocation`, {
                    method: "PUT",
                    credentials: "include",
                    signal: controller.signal,
                    body: JSON.stringify({
                        year,
                        month,
                        day,
                        name: selectedLocation.name,
                        lat: selectedLocation.lat,
                        lng: selectedLocation.lng,
                    }),
                });

                if (!response.ok) {
                    const { message } = await response.json();
                    toast.error(`Failed to set location: ${message}`);
                    setSelectedLocation(null);
                    return;
                }
            } catch (err: any) {
                if (err.name === "AbortError") {
                    toast.error("Request timed out while setting location");
                } else {
                    toast.error("Something went wrong while setting location");
                }
                setSelectedLocation(null);
            } finally {
                clearTimeout(timeout);
                setIsSavingLocation(false);
            }
        };

        if (Cookies.get('token')) setLocation();
    }, [selectedLocation]);

    useEffect(() => {
        const fetchLocation = async () => {
            setIsSavingLocation(true);
            const res = await fetch(`${import.meta.env.VITE_API_URI}/location/dayLocation/get`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    year: year,
                    month: month,
                    day: day,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.location) isInitialLocationLoad.current = true; // flag that this is initial data
                setSelectedLocation(data.location);
            } else {
                setSelectedLocation(null);
                toast.error(`there was an error fetching the location: ${(await res.json()).message}`)
            }
            setIsSavingLocation(false);
        };

        if (Cookies.get('token')) fetchLocation();
    }, [year, month, day]);

    return (
        <div className="flex flex-col md:flex-row h-screen p-3">
            {/* Events List */}
            {((window.innerWidth < 768 && !mobileShowForm) || (window.innerWidth >= 768)) && (
                <div className="w-full h-full overflow-y-auto p-4 bg-gray-100" onClick={handleClick}>
                    <LocationPicker
                        date={new Date(year, month, day)}
                        selectedLocation={selectedLocation}
                        onLocationChange={setSelectedLocation}
                        isSavingLocation={isSavingLocation}
                    />
                    {loading && (
                        <div className="flex justify-center">
                            <Spinner />
                        </div>
                    )}
                    {!loading && dayActivities && (
                        <div className="mt-2 flex flex-col space-y-2">
                            {(dayActivities.entries?.length ?? 0) > 0 && dayActivities.entries.map((entry, index) => (
                                <div
                                    key={index}
                                    style={{ backgroundColor: colors.activities[entry.activity] || "#ffffff" }}
                                    className="rounded-2xl shadow-md"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent handleClick from running
                                        setSelectedForm("activity");
                                        setEventPopUp({ state: "edit", activity: entry.activity, description: entry.description, time: entry.time || "", note: "", variable: "", value: "" });
                                        setMobileShowForm(true);
                                    }}
                                >
                                    <div
                                        className={`p-4 text-left text-[14px] ${isLightOrDark(colors.activities[entry.activity]) ? "text-black" : "text-white"
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-lg">{entry.activity}</h3>
                                                <span className="text-sm opacity-90">({getHumanTimeFromMinutes(entry.duration)})</span>
                                            </div>
                                            {entry.time && (
                                                <span className="text-sm opacity-80">{entry.time}</span>
                                            )}
                                        </div>

                                        <p
                                            className="text-sm leading-snug mt-1"
                                            dangerouslySetInnerHTML={{
                                                __html: highlightTimesAndNames(entry.description),
                                            }}
                                        ></p>
                                    </div>
                                </div>
                            ))}
                            {(dayActivities.variables?.length ?? 0) > 0 && (
                                <div className="space-y-2">
                                    {(dayActivities.entries?.length ?? 0) > 0 && <hr className="my-2" />}
                                    {dayActivities.variables.map((entry, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: colors.variables[entry.variable] || "#ffffff", // Default color if no match found
                                            }}
                                            className={`text-[14px] ${isLightOrDark(colors.variables[entry.variable]) ? 'text-black' : 'text-white'} rounded px-2 py-1`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent handleClick from running
                                                setSelectedForm("variable");
                                                setEventPopUp({ state: "edit", activity: "", description: "", time: "", variable: entry.variable, value: entry.value, note: "" })
                                                setMobileShowForm(true);
                                            }}
                                        >
                                            {entry.variable} - {entry.value}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {dayActivities?.note && (
                                <div>
                                    {((dayActivities.entries?.length ?? 0) > 0 || (dayActivities.variables?.length ?? 0) > 0) && <hr className="my-2" />}
                                    <div
                                        style={{
                                            backgroundColor: colors.note || "#ffffff", // Default color if no match found
                                        }}
                                        className={`${isLightOrDark(colors.note) ? 'text-black' : 'text-white'} rounded px-2 py-1`}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent handleClick from running
                                            setSelectedForm("note");
                                            setEventPopUp({ state: "edit", activity: "", description: "", time: "", note: dayActivities?.note || "", variable: "", value: "" })
                                            setMobileShowForm(true);
                                        }}
                                    >
                                        <span className="text-[14px]" dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(dayActivities.note || "") }}></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {!loading && !dayActivities && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm p-2">
                            {Cookies.get('token') ? <span><FaRegCalendarTimes className="text-lg" /> No activities recorded for today.</span> : <span><a
                                id="signup"
                                href="https://api.calendar.jules.tools/oauth/google"
                                className="inline-block px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
                            >
                                → Log in
                            </a> to record activities</span>}
                        </div>
                    )
                    }
                </div>
            )}

            {/* Calendar & Form (Hidden on mobile) */}
            {((window.innerWidth < 768 && mobileShowForm) || (window.innerWidth >= 768)) && (
                <div className="md:inline-flex flex-col px-4 bg-white max-w-fit">
                    {/* Simple Calendar */}
                    <div ref={calendarRef} className="p-4 border rounded mb-4 w-max">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                                if (!date) return; // Prevent clearing the date
                                isInitialLocationLoad.current = true;
                                setSelectedDate(date!);
                                setCurrentMonth(date!); // Update the month when a date is selected
                                navigate(`/calendar/day?year=${date?.getFullYear()}&month=${date?.getMonth()}&day=${date?.getDate()}`);
                            }}
                            captionLayout="dropdown"
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                        />
                    </div>
                    {/* Dropdown to select form type */}
                    <select
                        value={selectedForm}
                        onChange={(e) => { setSelectedForm(e.target.value as "activity" | "note" | "variable"); setEventPopUp({ state: "add", activity: "", description: "", time: "", note: "", variable: "", value: "" }) }}
                        className="p-4 border mb-4 rounded w-full mx-auto lg:mr-2 xl:mr-14 bg-white focus:bg-gray-200"
                        style={{ width: calendarWidth ? `${calendarWidth}px` : "auto" }}
                    >
                        <option value="activity">Activity</option>
                        <option value="variable">Variable</option>
                        <option value="note">Note</option>
                    </select>
                    {selectedForm === "activity" && (<div>
                        {/* Add Event Form */}
                        <div className="p-4 border rounded mr-0 lg:mr-2 xl:mr-14" style={{ width: calendarWidth ? `${calendarWidth}px` : "auto" }}>
                            <h3 className="text-lg font-semibold">{eventPopUp.state} activity</h3>
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
                                <input
                                    type="time"
                                    className="w-full p-2 border mt-2 rounded"
                                    value={eventPopUp.time ?? new Date().toISOString().slice(11, 16)} // fallback to current time if undefined
                                    onChange={(e) =>
                                        setEventPopUp((prev) => ({
                                            ...prev,
                                            time: e.target.value,
                                        }))
                                    }
                                />
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
                                    eventPopUp.state === "add" ? (
                                        actionLoading ? (
                                            <div className="w-full flex justify-center p-2 bg-blue-300 text-white rounded mt-2">
                                                <Spinner />
                                            </div>
                                        ) : (
                                            <button
                                                className="w-full p-2 bg-blue-500 text-white rounded mt-2"
                                                onClick={async () => {
                                                    await handleEventFinish();
                                                }}
                                            >
                                                {eventPopUp.state}
                                            </button>
                                        )
                                    ) : (
                                        actionLoading ? (
                                            <div className="w-full flex justify-center p-2 bg-blue-300 text-white rounded mt-2">
                                                <Spinner />
                                            </div>
                                        ) :
                                            (<div className="flex gap-2 mt-2">
                                                <button
                                                    className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    onClick={async () => {
                                                        await handleEventFinish();
                                                    }}
                                                >
                                                    {eventPopUp.state}
                                                </button>
                                                <button
                                                    className="w-12 h-10 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600"
                                                    onClick={async () => {
                                                        await handleDelete();
                                                    }}
                                                >
                                                    <MdDelete className="text-xl" />
                                                </button>
                                            </div>)
                                    )
                                }
                            </div>
                        </div>
                        <button onClick={handleClose} className="absolute top-2 right-2 text-gray-600 block md:hidden">✕</button>
                    </div>)}
                    {selectedForm === "note" && (<div>
                        <div className="p-4 border rounded mr-0 lg:mr-2 xl:mr-14" style={{ width: calendarWidth ? `${calendarWidth}px` : "auto" }}>
                            <h3 className="text-lg font-semibold">{eventPopUp.state} note</h3>
                            <div>
                                <textarea
                                    placeholder="Note for the day, e.g. visited @Michael and saw an aligator on my way home"
                                    className="w-full p-2 border mt-2 rounded"
                                    value={eventPopUp.note}
                                    onChange={(e) => { handleInputChange(e) }}
                                    onKeyDown={handleKeyDown}></textarea>
                                {suggestions.length > 0 && (
                                    <ul className="bg-white border rounded shadow-lg">
                                        {suggestions.map((suggestion, index) => {
                                            const textBeforeCursor = eventPopUp.note.slice(0, cursorPosition);
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
                                    eventPopUp.state === "add" ? (
                                        actionLoading ? (
                                            <div className="w-full flex justify-center p-2 bg-blue-300 text-white rounded mt-2">
                                                <Spinner />
                                            </div>
                                        ) : (
                                            <button
                                                className="w-full p-2 bg-blue-500 text-white rounded mt-2"
                                                onClick={async () => {
                                                    await handleEventFinish();
                                                }}
                                            >
                                                {eventPopUp.state}
                                            </button>
                                        )
                                    ) : (
                                        actionLoading ? (
                                            <div className="w-full flex justify-center p-2 bg-blue-300 text-white rounded mt-2">
                                                <Spinner />
                                            </div>
                                        ) :
                                            (<div className="flex gap-2 mt-2">
                                                <button
                                                    className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    onClick={async () => {
                                                        await handleEventFinish();
                                                    }}
                                                >
                                                    {eventPopUp.state}
                                                </button>
                                                <button
                                                    className="w-12 h-10 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600"
                                                    onClick={async () => {
                                                        await handleDelete();
                                                    }}
                                                >
                                                    <MdDelete className="text-xl" />
                                                </button>
                                            </div>)
                                    )
                                }
                            </div>
                        </div>
                        <button onClick={handleClose} className="absolute top-2 right-2 text-gray-600 block md:hidden">✕</button>
                    </div>)}
                    {selectedForm === "variable" && (<div>
                        {/* Add Event Form */}
                        <div className="p-4 border rounded mr-0 lg:mr-2 xl:mr-14" style={{ width: calendarWidth ? `${calendarWidth}px` : "auto" }}>
                            <h3 className="text-lg font-semibold">{eventPopUp.state} variable</h3>
                            <div>
                                <input type="text" placeholder="Variable, e.g. Weight" className="w-full p-2 border rounded" value={eventPopUp.variable}
                                    onChange={(e) => { setSuggestionsType("variable"); handleInputChange(e) }}
                                    onKeyDown={handleKeyDown}
                                    disabled={eventPopUp.state !== "add"} />
                                {suggestions.length > 0 && suggestionsTypeRef.current === "variable" && (
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
                                                    <span key={index} className={eventPopUp.variable.toLowerCase().includes(char.toLowerCase()) ? "bg-purple-300" : ""}>
                                                        {char}
                                                    </span>
                                                ))}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <input
                                    type="number"
                                    placeholder="Value, e.g. 70"
                                    className="w-full p-2 border mt-2 rounded"
                                    value={eventPopUp.value}
                                    onChange={(e) => { setSuggestionsType("name"); handleInputChange(e) }}></input>
                                {
                                    eventPopUp.state === "add" ? (
                                        actionLoading ? (
                                            <div className="w-full flex justify-center p-2 bg-blue-300 text-white rounded mt-2">
                                                <Spinner />
                                            </div>
                                        ) : (
                                            <button
                                                className="w-full p-2 bg-blue-500 text-white rounded mt-2"
                                                onClick={async () => {
                                                    await handleEventFinish();
                                                }}
                                            >
                                                {eventPopUp.state}
                                            </button>
                                        )
                                    ) : (
                                        actionLoading ? (
                                            <div className="w-full flex justify-center p-2 bg-blue-300 text-white rounded mt-2">
                                                <Spinner />
                                            </div>
                                        ) :
                                            (<div className="flex gap-2 mt-2">
                                                <button
                                                    className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    onClick={async () => {
                                                        await handleEventFinish();
                                                    }}
                                                >
                                                    {eventPopUp.state}
                                                </button>
                                                <button
                                                    className="w-12 h-10 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600"
                                                    onClick={async () => {
                                                        await handleDelete();
                                                    }}
                                                >
                                                    <MdDelete className="text-xl" />
                                                </button>
                                            </div>)
                                    )
                                }
                            </div>
                        </div>
                        <button onClick={handleClose} className="absolute top-2 right-2 text-gray-600 block md:hidden">✕</button>
                    </div>)}
                </div>
            )}
        </div>
    );
};

export default Day;