import { useState } from "react";
import { dayNames } from "../utils/helpers";
import { useActivityMetadata } from "../hooks/useActivityMetadata";
import { useCalendarState } from "../hooks/useCalendarState";
import { useActivities } from "../hooks/useActivities";
import { useCalendarPopup } from "../hooks/useCalendarPopup";
import { DayCell } from "./DayCell";
import { CalendarHeader } from "./CalendarHeader";

const Calendar: React.FC = () => {
  const [reload] = useState(false);
  const { colors } = useActivityMetadata(reload);
  const { selectedDate, goToDate } = useCalendarState();
  const { activities } = useActivities(selectedDate.getFullYear(), selectedDate.getMonth());
  // temp values for popup
  const [tempYear, setTempYear] = useState<number>(selectedDate.getFullYear());
  const [tempMonth, setTempMonth] = useState<number>(selectedDate.getMonth());
  const applyDateChange = () => {
    goToDate(new Date(tempYear, tempMonth, 1), { stayOnMonth: true });
    setPopupState({ type: null, position: popupState.position });
    console.log(`applied date change to ${tempYear}-${tempMonth}`)
  };
  const { popupState, setPopupState, popupRef } = useCalendarPopup(applyDateChange);


  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const lastMonthDays = (year: number, month: number) => daysInMonth(year, month - 1);

  const days = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  const previousMonthDays = lastMonthDays(year, month);

  return (
    <div className="grid grid-rows-[auto,1fr] h-full p-3">
      {/* Header */}
      <CalendarHeader
        goToDate={goToDate}
        selectedDate={selectedDate}
        popupState={popupState}
        setPopupState={setPopupState}
        tempMonth={tempMonth}
        setTempMonth={setTempMonth}
        tempYear={tempYear}
        setTempYear={setTempYear}
        popupRef={popupRef}
      />

      {/* Calendar Grid */}
      <div className="container gap-0 md:gap-2 text-center">
        {/* Day Names */}
        {dayNames.map((day, index) => (
          <div key={index} className="font-bold p-2">
            {day}
          </div>
        ))}

        {/* Grey Boxes for Non-Month Days */}
        {Array.from({ length: startDay }, (_, i) => (
          <div
            key={`start-${i}`}
            className="p-1 md:p-4 border bg-gray-200 text-gray-400 rounded-lg item"
          >
            {previousMonthDays - startDay + i + 1}
          </div>
        ))}

        {/* Days of the Month */}
        {Array.from({ length: days }, (_, i) => {
          return (<DayCell
            // day={day}
            month={month}
            year={year}
            activities={activities}
            colors={colors}
            goToDate={goToDate}
            i={i}
          />)
        })}

        {/* Grey Boxes for Remaining Non-Month Days */}
        {Array.from(
          { length: (7 - ((startDay + days) % 7)) % 7 },
          (_, i) => (
            <div
              key={`end-${i}`}
              className="p-1 md:p-4 border bg-gray-200 text-gray-400 rounded-lg item"
            >
              {i + 1}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Calendar;
