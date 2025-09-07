import { useEffect, useRef, useState } from "react";
import "react-day-picker/dist/style.css";
import Spinner from "../utils/Spinner";
import { FaRegCalendarTimes } from "react-icons/fa";
import { LocationPicker } from "../utils/LocationPicker";
import Cookies from "js-cookie";
import { useDayActivities } from "../../hooks/useDayActivities";
import { useDayLocation } from "../../hooks/useDayLocation";
import { useActivityMetadata } from "../../hooks/useActivityMetadata";
import { useEventForm } from "../../hooks/useEventForm";
import { ObjectId } from "bson";
import { useCalendarState } from "../../hooks/useCalendarState";
import { useSuggestions } from "../../hooks/useSuggestions";
import { EventList } from "./EventList";
import { EventForm } from "./EventForm";
import { CalendarPicker } from "./CalendarPicker";

const Day = () => {
    const [reload, setReload] = useState(false);

    const [mobileShowForm, setMobileShowForm] = useState<boolean>(false);

    const { selectedDate, currentMonth, goToDate, setCurrentMonth } = useCalendarState();
    const { activities: dayActivities, loading } = useDayActivities(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), reload);
    const { selectedLocation, setSelectedLocation, isSavingLocation, deleteLocation } = useDayLocation(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const { colors, names } = useActivityMetadata(reload);
    const { eventPopUp, setEventPopUp, selectedForm, setSelectedForm, actionLoading, handleEventFinish, handleDelete } = useEventForm(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), reload, setReload);
    const suggestionsHook = useSuggestions({
        colors, names, eventPopUp, setEventPopUp, selectedForm
    });

    const handleClick = () => {
        if (window.innerWidth < 768) {
            setMobileShowForm(true);
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            setEventPopUp({ state: "add", _id: new ObjectId, activity: "", description: "", start: "", end: `${hh}:${mm}`, note: "", variable: "", value: "" });
            suggestionsHook.setSuggestions([]);
            suggestionsHook.setSelectedSuggestionIndex(-1);
            suggestionsHook.setSuggestionsType("");
        }
        else {
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            console.log(`${hh}:${mm}`);
            setEventPopUp({ state: "add", _id: new ObjectId, activity: "", description: "", start: "", end: `${hh}:${mm}`, note: "", variable: "", value: "" });
            suggestionsHook.setSuggestions([]);
            suggestionsHook.setSelectedSuggestionIndex(-1);
            suggestionsHook.setSuggestionsType("");
        }
    };

    const calendarRef = useRef<HTMLDivElement>(null);
    const [calendarWidth, setCalendarWidth] = useState<number | null>(null);

    useEffect(() => {
        if (calendarRef.current) {
            setCalendarWidth(calendarRef.current.offsetWidth);
        }
    }, []);

    const handleClose = () => {
        setMobileShowForm(false);
    }

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
                        deleteLocation={deleteLocation}
                    />
                    {loading && (
                        <div className="flex justify-center">
                            <Spinner />
                        </div>
                    )}
                    {!loading && dayActivities && (
                        <EventList
                            dayActivities={dayActivities}
                            colors={colors}
                            setSelectedForm={setSelectedForm}
                            setEventPopUp={setEventPopUp}
                            setMobileShowForm={setMobileShowForm}
                        />
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
                    <CalendarPicker
                        selectedDate={selectedDate}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        goToDate={goToDate}
                        calendarRef={calendarRef}
                        calendarWidth={calendarWidth}
                        selectedForm={selectedForm}
                        setSelectedForm={setSelectedForm}
                        handleClose={handleClose}
                    />
                    <EventForm
                        calendarWidth={calendarWidth}
                        selectedForm={selectedForm}
                        eventPopUp={eventPopUp}
                        setEventPopUp={setEventPopUp}
                        suggestionsHook={suggestionsHook}
                        actionLoading={actionLoading}
                        handleEventFinish={handleEventFinish}
                        handleDelete={handleDelete}
                    />
                </div>
            )}
        </div>
    );
};

export default Day;