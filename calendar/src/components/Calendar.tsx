import { useState, useRef, useEffect } from "react";
type FrontendUserActivity = Omit<NewUserActivity, "userId">;
import { ObjectId } from "bson";

export interface ActivityEntry {
  activity: string;
  duration: number; // number of minutes
  description: string;
}

export interface UserActivity {
  _id: ObjectId,
  userId: ObjectId,
  date: Date,
  entries: ActivityEntry[]
};


// Utility type for creating new users without an _id field
export type NewUserActivity = Omit<UserActivity, "_id">;

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // const [activePopup, setActivePopup] = useState<"year" | "month" | "day" | "moreActivities" | null>(null);
  // const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({
  //   top: 0,
  //   left: 0,
  // });
  const [popupState, setPopupState] = useState<{
    type: "year" | "month" | "day" | "moreActivities" | null;
    position: { top: number; left: number } | null;
    day: number | null;
    activities: ActivityEntry[] | null;
  }>({
    type: null,
    position: null,
    day: null,
    activities: null,
  });
  const [tempYear, setTempYear] = useState<number>(currentDate.getFullYear());
  const [tempMonth, setTempMonth] = useState<number>(currentDate.getMonth());

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
    setPopupState((prevState) => {
      if (prevState.activities && prevState.day === day) {
        return {
          ...prevState,
          position: { top: rect.top + window.scrollY - rect.height / 2, left: rect.left + window.scrollX - rect.width },
        };
      }
      return {
        ...prevState,
        type: "day",
        position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
        day,
        activities: null,
      };
    });
  };


  const handleMoreActivitesClick = (event: React.MouseEvent, day: number, activities: ActivityEntry[]) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupState((prevState) => ({
      ...prevState,
      type: "moreActivities",
      position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
      day,
      activities,
    }));
  };


  const showPopupNextToButton = (event: React.MouseEvent, popupType: "year" | "month") => {
    const rect = event.currentTarget.getBoundingClientRect();
    // setPopupPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    setTempYear(currentDate.getFullYear());
    setTempMonth(currentDate.getMonth());
    // setActivePopup(popupType);
    setPopupState({ type: popupType, position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX }, day: popupState.day, activities: popupState.activities });
  };

  const applyDateChange = () => {
    setCurrentDate(new Date(tempYear, tempMonth, 1));
    // setActivePopup(null);
    setPopupState({ type: null, position: popupState.position, day: popupState.day, activities: popupState.activities });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
      // setActivePopup(null);
      // setSelectedDay(null);
      setPopupState({ type: null, position: popupState.position, day: null, activities: popupState.activities });
      // setMoreActivities(null);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // if (event.key === "Enter" && (activePopup === "month" || activePopup === "year")) {
    if (event.key === "Enter" && (popupState.type === "month" || popupState.type === "year")) {
      applyDateChange();
    }
  };

  useEffect(() => {
    // if (activePopup) {
    if (popupState.type) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // }, [activePopup, tempYear, tempMonth]);
  }, [popupState.type, tempYear, tempMonth]);

  const year: number = currentDate.getFullYear();
  const month: number = currentDate.getMonth();
  const days: number = daysInMonth(year, month);
  const startDay: number = firstDayOfMonth(year, month);
  const previousMonthDays: number = lastMonthDays(year, month);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchActivities = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/activity?year=${year}&month=${month}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }
      const data: UserActivity[] = await response.json();
      setActivities(activities.concat(data));
    };

    fetchActivities();
  }, [year, month]);

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
    };

    fetchColors();
  }, []);

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

  function getHumanTimeFromMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let ret = '';
    if (hours !== 0) {
      ret += `${hours}h`;
    }
    if (remainingMinutes !== 0) {
      ret += `${remainingMinutes}min`;
    }
    return ret
  }

  // const [moreActivities, setMoreActivities] = useState<{
  //   day: number;
  //   activities: ActivityEntry[];
  // } | null>(null);

  const renderDayCell = (day: number, month: number, year: number, activities: FrontendUserActivity[]) => {
    const dateString = new Date(year, month, day).toISOString().split("T")[0];
    const activitiesForDay = activities.find(
      (activity: FrontendUserActivity) => new Date(activity.date).toISOString().split("T")[0] === dateString
    );

    return (
      <div key={day}>
        {activitiesForDay && (
          <div className="mt-2 flex flex-col items-center space-y-1">
            {activitiesForDay.entries.slice(0, 2).map((entry, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: colors[entry.activity] || "#ffffff", // Default color if no match found
                }}
                className={`text-xs ${isLightOrDark(colors[entry.activity]) ? 'text-black' : 'text-white'} rounded px-2 py-1`}
              >
                {entry.activity} - {getHumanTimeFromMinutes(entry.duration)}
              </div>
            ))}
            {activitiesForDay.entries.length > 2 && (
              <button
                className="text-xs text-blue-500 underline mt-1 bg-black"
                onClick={(e) => {
                  // e.stopPropagation(); // Prevent parent `onClick` from triggering
                  handleMoreActivitesClick(e, day, activitiesForDay.entries);
                }}
              >
                + {activitiesForDay.entries.length - 2} more
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const isLightOrDark = (hex: string): boolean => {
    // Remove the hash symbol if it's present
    hex = hex.replace('#', '');

    // Parse the red, green, and blue values from the hex string
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Calculate luminance using the formula
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Return if the color is light or dark
    return luminance > 128 ? true : false;
  };

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
          <div key={index} className="font-bold p-2">
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
              className="p-4 border rounded-lg hover:bg-gray-200 cursor-pointer flex justify-center"
              onClick={(e) => handleDayClick(e, day)}
            >
              {isToday && activities ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  {day}
                  {renderDayCell(day, month, year, activities.map(({ _id, userId, ...rest }) => rest))}
                </div>
              ) : (
                <div>
                  {day}
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
              className="p-4 border bg-gray-200 text-gray-400 rounded-lg"
            >
              {i + 1}
            </div>
          )
        )}
      </div>

      {/* Popup */}
      {/* {activePopup && ( */}
      {popupState.type && (
        <div
          ref={popupRef}
          className="absolute bg-white border rounded-lg shadow-md p-4"
          style={{ top: popupState.position?.top, left: popupState.position?.left }}
        // style={{ top: popupPosition.top, left: popupPosition.left }}
        >
          {/* {activePopup === "day" && selectedDay && ( */}
          {popupState.type === "day" && popupState.day && (
            <>
              <h2 className="text-lg font-bold mb-4">
                Add details for {popupState.day} {monthNames[month]} {year}
                {/* Add details for {selectedDay} {monthNames[month]} {year} */}
              </h2>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                // onClick={() => setActivePopup(null)}
                onClick={() => setPopupState({ type: null, position: popupState.position, day: popupState.day, activities: popupState.activities })}
              >
                Close
              </button>
            </>
          )}
          {popupState.type === "month" && (
            // {activePopup === "month" && (
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
            // {activePopup === "year" && (
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
          {popupState.type === "moreActivities" && popupState.activities && (
            // {activePopup === "moreActivities" && moreActivities && (
            <>
              {popupState.day === new Date().getDate() &&
                // {moreActivities.day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear() ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                  {popupState.day}
                  {/* {moreActivities.day} */}
                </div>
              ) : (
                <div>{popupState.day}</div>
                // <div>{moreActivities.day}</div>
              )}
              <div className="mt-4 space-y-2">
                {popupState.activities.map((entry, index) => (
                  // {moreActivities.activities.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: colors[entry.activity] || "#ffffff", // Default color if no match found
                    }}
                    className={`text-xs ${isLightOrDark(colors[entry.activity]) ? 'text-black' : 'text-white'} rounded px-2 py-1`}
                  >
                    {entry.activity} - {getHumanTimeFromMinutes(entry.duration)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
