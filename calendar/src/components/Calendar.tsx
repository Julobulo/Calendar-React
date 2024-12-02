import { useState, useRef, useEffect } from "react";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activePopup, setActivePopup] = useState<"year" | "month" | "day" | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [tempYear, setTempYear] = useState(currentDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(currentDate.getMonth());

  const popupRef = useRef<HTMLDivElement | null>(null);

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const lastMonthDays = (year: number, month: number) => {
    return daysInMonth(year, month - 1);
  };

  const handleDayClick = (event: React.MouseEvent, day: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    setSelectedDay(day);
    setActivePopup("day");
  };

  const showPopupNextToButton = (event: React.MouseEvent, popupType: "year" | "month") => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    setTempYear(currentDate.getFullYear());
    setTempMonth(currentDate.getMonth());
    setActivePopup(popupType);
  };

  const applyDateChange = () => {
    setCurrentDate(new Date(tempYear, tempMonth, 1));
    setActivePopup(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      setActivePopup(null);
      setSelectedDay(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (activePopup === "month" || activePopup === "year")) {
      applyDateChange();
    }
  };

  useEffect(() => {
    if (activePopup) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePopup, tempYear, tempMonth]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  const previousMonthDays = lastMonthDays(year, month);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="grid grid-rows-[auto,1fr] h-full">
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
      <div className="grid grid-cols-7 gap-2 text-center h-full">
        {/* Day Names */}
        {dayNames.map((day, index) => (
          <div key={index} className="font-bold">
            {day}
          </div>
        ))}

        {/* Grey Boxes for Non-Month Days */}
        {Array.from({ length: startDay }, (_, i) => (
          <div
            key={`start-${i}`}
            className="p-4 border bg-gray-200 text-gray-400 rounded-lg"
          >
            {previousMonthDays - startDay + i + 1}
          </div>
        ))}

        {/* Days of the Month */}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const today = new Date();
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          return (
            <div
              key={i}
              className="p-4 border rounded-lg hover:bg-gray-200 cursor-pointer flex  justify-center"
              onClick={(e) => handleDayClick(e, day)}
            >
              {isToday ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  {day}
                </div>
              ) : (
                day
              )}
            </div>
          );
        })}

        {/* Grey Boxes for Remaining Non-Month Days */}
        {Array.from(
          { length: (7 - ((startDay + days) % 7)) % 7 },
          (_, i) => (
            <div
              key={`end-${i}`}
              className="p-4 border bg-gray-200 text-gray-400 rounded-lg"
            >
              {i + 1}
            </div>
          )
        )}
      </div>

      {/* Popup */}
      {activePopup && (
        <div
          ref={popupRef}
          className="absolute bg-white border rounded-lg shadow-md p-4"
          style={{ top: popupPosition.top, left: popupPosition.left }}
        >
          {activePopup === "day" && selectedDay && (
            <>
              <h2 className="text-lg font-bold mb-4">
                Add details for {selectedDay} {monthNames[month]} {year}
              </h2>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setActivePopup(null)}
              >
                Close
              </button>
            </>
          )}
          {activePopup === "month" && (
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
          {activePopup === "year" && (
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
