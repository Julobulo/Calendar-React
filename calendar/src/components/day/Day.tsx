import { useEffect, useRef, useState } from "react";
import { getHumanReadableDiffBetweenTimes, highlightTimesAndNames } from "../../utils/helpers";
import { isLightOrDark } from "../../utils/helpers";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Spinner from "../Spinner";
import { MdDelete } from "react-icons/md";
import { FaRegCalendarTimes } from "react-icons/fa";
import { LocationPicker } from "../LocationPicker";
import Cookies from "js-cookie";
import { useActivities } from "../../hooks/useActivities";
import { useDayLocation } from "../../hooks/useDayLocation";
import { useActivityMetadata } from "../../hooks/useActivityMetadata";
import { useEventForm } from "../../hooks/useEventForm";
import { ObjectId } from "bson";
import { useCalendarState } from "../../hooks/useCalendarState";

const Day = () => {
    const [reload, setReload] = useState(false);

    const [mobileShowForm, setMobileShowForm] = useState<boolean>(false);

    const { selectedDate, currentMonth, goToDate, setCurrentMonth } = useCalendarState();
    const { activities: dayActivities, loading } = useActivities(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), reload);
    const { selectedLocation, setSelectedLocation, isSavingLocation } = useDayLocation(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const { colors, names } = useActivityMetadata(reload);
    const { eventPopUp, setEventPopUp, selectedForm, setSelectedForm, actionLoading, handleEventFinish, handleDelete } = useEventForm(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), reload, setReload);

    const handleClick = () => {
        if (window.innerWidth < 768) {
            setMobileShowForm(true);
            setEventPopUp({ state: "add", _id: new ObjectId, activity: "", description: "", start: "", end: new Date().toISOString().slice(11, 16), note: "", variable: "", value: "" });
        }
        else {
            setEventPopUp({ state: "add", _id: new ObjectId, activity: "", description: "", start: "", end: new Date().toISOString().slice(11, 16), note: "", variable: "", value: "" });
        }
    };

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

    const isInitialLocationLoad = useRef(true);

    return (
        <div className="flex flex-col md:flex-row h-screen p-3">
            {/* Events List */}
            {((window.innerWidth < 768 && !mobileShowForm) || (window.innerWidth >= 768)) && (
                <div className="w-full h-full overflow-y-auto p-4 bg-gray-100" onClick={handleClick}>
                    <LocationPicker
                        date={new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())}
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
                                        setEventPopUp({ state: "edit", _id: entry._id, activity: entry.activity, description: entry.description, start: entry.start || "", end: entry.end || "", note: "", variable: "", value: "" });
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
                                                <span className="text-sm opacity-90">({getHumanReadableDiffBetweenTimes(entry.start || "", entry.end || "")})</span>
                                            </div>
                                            {entry.start && (
                                                <span className="text-sm opacity-80">{entry.start}</span>
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
                                                setEventPopUp({ state: "edit", _id: new ObjectId, activity: "", description: "", start: "", end: "", variable: entry.variable, value: entry.value, note: "" })
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
                                            setEventPopUp({ state: "edit", _id: new ObjectId, activity: "", description: "", start: "", end: "", note: dayActivities?.note || "", variable: "", value: "" })
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
                                goToDate(date!);
                            }}
                            captionLayout="dropdown"
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                        />
                    </div>
                    {/* Dropdown to select form type */}
                    <select
                        value={selectedForm}
                        onChange={(e) => { setSelectedForm(e.target.value as "activity" | "note" | "variable"); setEventPopUp({ state: "add", _id: new ObjectId, activity: "", description: "", start: "", end: "", note: "", variable: "", value: "" }) }}
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
                                    id="start"
                                    className="w-full p-2 border mt-2 rounded"
                                    value={eventPopUp.start}
                                    onChange={(e) =>
                                        setEventPopUp((prev) => ({
                                            ...prev,
                                            start: e.target.value,
                                        }))
                                    }
                                />
                                <input
                                    type="time"
                                    id="end"
                                    className="w-full p-2 border mt-2 rounded"
                                    value={eventPopUp.end ?? new Date().toISOString().slice(11, 16)} // fallback to current time if undefined
                                    onChange={(e) =>
                                        setEventPopUp((prev) => ({
                                            ...prev,
                                            end: e.target.value,
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