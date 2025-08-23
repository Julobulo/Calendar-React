import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface CalendarPickerProps {
    selectedDate: Date;
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    goToDate: (date: Date) => void;
    calendarRef: React.RefObject<HTMLDivElement>;
    calendarWidth: number | null;
    selectedForm: "activity" | "note" | "variable";
    setSelectedForm: (form: "activity" | "note" | "variable") => void;
    handleClose: () => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
    selectedDate,
    currentMonth,
    setCurrentMonth,
    goToDate,
    calendarRef,
    calendarWidth,
    selectedForm,
    setSelectedForm,
    handleClose
}) => {
    return (
        <div>
            <div ref={calendarRef} className="p-4 border rounded mb-4 w-max">
                <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && goToDate(date)}
                    captionLayout="dropdown"
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                />
            </div>
            <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value as "activity" | "note" | "variable")}
                className="p-4 border mb-4 rounded w-full mx-auto lg:mr-2 xl:mr-14 bg-white focus:bg-gray-200"
                style={{ width: calendarWidth ? `${calendarWidth}px` : "auto" }}
            >
                <option value="activity">Activity</option>
                <option value="variable">Variable</option>
                <option value="note">Note</option>
            </select>
            <button onClick={handleClose} className="absolute top-2 right-2 text-gray-600 block md:hidden">✕</button>
        </div>
    );
};
