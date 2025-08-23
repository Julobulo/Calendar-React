import { useState } from "react";
import { dayNames, monthNames } from "../utils/helpers";
import { useActivityMetadata } from "../hooks/useActivityMetadata";
import { useCalendarState } from "../hooks/useCalendarState";
import { useActivities } from "../hooks/useActivities";
import { useCalendarPopup } from "../hooks/useCalendarPopup";
import { DayCell } from "./DayCell";

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

  const goToToday = () => goToDate(new Date(), { stayOnMonth: true });


  const showPopupNextToButton = (event: React.MouseEvent, popupType: "year" | "month") => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTempYear(selectedDate.getFullYear());
    setTempMonth(selectedDate.getMonth());
    setPopupState({ type: popupType, position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: popupState.position?.width as number, height: popupState.position?.height as number } });
  };

  return (
    <div className="grid grid-rows-[auto,1fr] h-full p-3">
      {/* Header */}
      <div className="mb-4 flex justify-center space-x-4">
        <button
          className="text-xl font-bold"
          onClick={(e) => showPopupNextToButton(e, "month")}
        >
          {monthNames[month]}
        </button>
        <button
          className="text-xl font-bold"
          onClick={(e) => showPopupNextToButton(e, "year")}
        >
          {year}
        </button>
        <button
          className="text-xl font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={goToToday}
        >
          Today
        </button>
      </div>

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

      {/* Popup */}
      {popupState.type && (
        <div
          ref={popupRef}
          className="absolute bg-white border rounded-lg shadow-md p-4"
          style={{ top: popupState.position?.top, left: popupState.position?.left, width: popupState.position?.width, height: popupState.position?.height }}
        >
          {popupState.type === "month" && (
            <>
              <h2 className="text-lg font-bold mb-4">Select Month</h2>
              <select
                value={tempMonth}
                onChange={(e) => setTempMonth(Number(e.target.value))}
                className="border p-2 rounded w-full"
              >
                {monthNames.map((name, index) => (
                  <option value={index} key={index}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={applyDateChange}
              >
                Change
              </button>
            </>
          )}
          {popupState.type === "year" && (
            <>
              <h2 className="text-lg font-bold mb-4">Select Year</h2>
              <input
                type="number"
                value={tempYear}
                onChange={(e) => setTempYear(Number(e.target.value))}
                className="border p-2 rounded w-full"
              />
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={applyDateChange}
              >
                Change
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
