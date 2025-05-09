import { useState, useRef, useEffect } from "react";
type FrontendUserActivity = Omit<NewUserActivity, "userId">;
import { useNavigate } from "react-router-dom";
import { dayNames, getHumanTimeFromMinutes, isLightOrDark, monthNames, NewUserActivity, UserActivity } from "../utils/helpers";
import { VscSymbolVariable } from "react-icons/vsc";
import { LuNotebookPen } from "react-icons/lu";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(
      Number(localStorage.getItem('year')) || (new Date()).getFullYear(),
      Number(localStorage.getItem('month')) || (new Date()).getMonth(),
      Number(localStorage.getItem('day')) || (new Date()).getDate(),
    ));
  const [popupState, setPopupState] = useState<{
    type: "year" | "month" | null;
    position: { top: number; left: number; width: number; height: number } | null;
  }>({
    type: null,
    position: null,
  });
  const [tempYear, setTempYear] = useState<number>(currentDate.getFullYear());
  const [tempMonth, setTempMonth] = useState<number>(currentDate.getMonth());
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`month: ${currentDate.getMonth()}, year: ${currentDate.getFullYear()}, day: ${currentDate.getDate()}`);
    localStorage.setItem('day', currentDate.getDate().toString());
    localStorage.setItem('month', currentDate.getMonth().toString());
    localStorage.setItem('year', currentDate.getFullYear().toString());
  }, [currentDate])

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

  const handleDayClick = (day: number) => {
    navigate(`/calendar/day?year=${year}&month=${month}&day=${day}`);
  };


  const handleMoreActivitesClick = (day: number) => {
    navigate(`/calendar/day?year=${year}&month=${month}&day=${day}`);
  };


  const showPopupNextToButton = (event: React.MouseEvent, popupType: "year" | "month") => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTempYear(currentDate.getFullYear());
    setTempMonth(currentDate.getMonth());
    setPopupState({ type: popupType, position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: popupState.position?.width as number, height: popupState.position?.height as number } });
  };

  const applyDateChange = () => {
    setCurrentDate(new Date(tempYear, tempMonth, 1));
    setPopupState({ type: null, position: popupState.position });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      setPopupState({ type: null, position: null });
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (popupState.type === "month" || popupState.type === "year")) {
      applyDateChange();
    }
  };

  useEffect(() => {
    if (popupState.type) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popupState.type, tempYear, tempMonth]);

  const year: number = currentDate.getFullYear();
  const month: number = currentDate.getMonth();
  const days: number = daysInMonth(year, month);
  const startDay: number = firstDayOfMonth(year, month);
  const previousMonthDays: number = lastMonthDays(year, month);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [colors, setColors] = useState<{
    activities: { [activity: string]: string };
    note: string;
    variables: { [variable: string]: string };
  }>({ activities: {}, note: "", variables: {} });

  useEffect(() => {
    const fetchActivities = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/activity?year=${year}&month=${month}`, {
        credentials: "include"
      });
      if (!response.ok) {
        toast.error(`Failed to fetch activities: ${(await response.json()).message}`);
        return
      }
      const data: UserActivity[] = await response.json();
      setActivities(activities.concat(data));
    };

    if (Cookies.get('token')) fetchActivities();
  }, [year, month]);

  useEffect(() => {
    const fetchColors = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/colors`, {
        method: "GET",
        credentials: "include", // Include cookies in the request
      });
      if (!response.ok) {
        toast.error(`Failed to fetch colors: ${(await response.json()).message}`);
        return
      }
      const data = await response.json();
      setColors(data);
    };

    if (Cookies.get('token')) fetchColors();
  }, []);

  const renderDayCell = (
    day: number,
    month: number,
    year: number,
    activities: FrontendUserActivity[]
  ) => {
    const dateString = new Date(year, month, day + 1).toISOString().split("T")[0];
    const activitiesForDay = activities.find(
      (activity: FrontendUserActivity) =>
        new Date(activity.date).toISOString().split("T")[0] === dateString
    );

    const maxItemsToShow = 1;
    const displayItems: React.ReactNode[] = [];

    if (!activitiesForDay) {
      return <div key={day} />;
    }

    const entries = activitiesForDay.entries || [];
    for (let i = 0; i < entries.length && displayItems.length < maxItemsToShow; i++) {
      const entry = entries[i];
      const bg = colors.activities[entry.activity] || "#ffffff";
      const textColor = isLightOrDark(bg) ? "text-black" : "text-white";

      displayItems.push(
        <div
          key={`entry-${i}`}
          style={{ backgroundColor: bg }}
          className={`text-[5px] md:text-sm ${textColor} rounded px-2 py-1`}
        >
          {entry.activity} - {getHumanTimeFromMinutes(entry.duration)}
        </div>
      );
    }

    const variables = activitiesForDay.variables || [];
    for (let i = 0; i < variables.length && displayItems.length < maxItemsToShow; i++) {
      const variable = variables[i];
      const bg = colors.variables?.[variable.variable] || "#e2e8f0"; // default gray-200
      const textColor = isLightOrDark(bg) ? "text-black" : "text-white";

      displayItems.push(
        <div
          key={`variable-${i}`}
          style={{ backgroundColor: bg }}
          className={`text-[5px] md:text-sm ${textColor} rounded px-2 py-1 flex items-center space-x-1`}
        >
          <VscSymbolVariable className="text-xs" />
          <span>{variable.variable}: {variable.value}</span>
        </div>
      );
    }

    if (activitiesForDay.note && displayItems.length < maxItemsToShow) {
      const bg = colors.note || "#f5f5f5"; // light gray fallback
      const textColor = isLightOrDark(bg) ? "text-black" : "text-white";

      displayItems.push(
        <div
          key="note"
          style={{ backgroundColor: bg }}
          className={`text-[5px] md:text-sm ${textColor} rounded px-2 py-1 flex items-center space-x-1`}
        >
          <LuNotebookPen className="text-sm"/>
          <span>{activitiesForDay.note}</span>
        </div>
      );
    }

    const totalEntries = entries.length;
    const totalVariables = variables.length;
    const hasNote = !!activitiesForDay.note;

    const totalItems = totalEntries + totalVariables + (hasNote ? 1 : 0);
    const hiddenItems = Math.max(0, totalItems - displayItems.length);

    return (
      <div key={day}>
        <div className="mt-2 flex flex-col items-center space-y-1">
          {displayItems}
          {hiddenItems > 0 && (
            <button
              className="text-[5px] md:text-sm text-blue-500 mt-1 rounded"
              onClick={() => handleMoreActivitesClick(day)}
            >
              + {hiddenItems} more
            </button>
          )}
        </div>
      </div>
    );
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
          const day = i + 1;
          const today = new Date();
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

          return (
            <div
              key={i}
              className="p-1 md:p-4 border rounded-lg hover:bg-gray-200 cursor-pointer flex justify-center item"
              onClick={() => handleDayClick(day)}
            >
              {isToday && activities ? (
                <div className="flex flex-col items-center">
                  {/* Blue circle for today's date */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                    {day}
                  </div>
                  {/* Activities below the date */}
                  {renderDayCell(day, month, year, activities.map(({ _id, userId, ...rest }) => rest))}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Regular day number */}
                  <div>{day}</div>
                  {renderDayCell(day, month, year, activities.map(({ _id, userId, ...rest }) => rest))}
                </div>
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
