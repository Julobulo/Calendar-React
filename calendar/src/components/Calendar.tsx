import { useState } from "react";

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showYearPopup, setShowYearPopup] = useState(false);
    const [showMonthPopup, setShowMonthPopup] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [isChanged, setIsChanged] = useState(false);

    const daysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const firstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handleYearChange = (newYear: number) => {
        setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
        setIsChanged(true);
    };

    const handleMonthChange = (newMonth: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
        setIsChanged(true);
    };

    const handleDayClick = (day: number) => {
        setSelectedDay(day);
    };

    const closePopup = () => {
        setSelectedDay(null);
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

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
        <div className="p-10">
            {/* Header */}
            <div className="mb-4 flex justify-center space-x-4">
                <button
                    className="text-xl font-bold"
                    onClick={() => {
                        setShowMonthPopup(true);
                        setIsChanged(false);
                    }}
                >
                    {monthNames[month]}
                </button>
                <button
                    className="text-xl font-bold"
                    onClick={() => {
                        setShowYearPopup(true);
                        setIsChanged(false);
                    }}
                >
                    {year}
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center">
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
                        {/* Empty */}
                    </div>
                ))}

                {/* Days of the Month */}
                {Array.from({ length: days }, (_, i) => (
                    <div
                        key={i}
                        className="p-4 border rounded-lg hover:bg-gray-200 cursor-pointer"
                        onClick={() => handleDayClick(i + 1)}
                    >
                        {i + 1}
                    </div>
                ))}

                {/* Grey Boxes for Remaining Non-Month Days */}
                {Array.from(
                    { length: (7 - ((startDay + days) % 7)) % 7 },
                    (_, i) => (
                        <div
                            key={`end-${i}`}
                            className="p-4 border bg-gray-200 text-gray-400 rounded-lg"
                        >
                            {/* Empty */}
                        </div>
                    )
                )}
            </div>

            {/* Day Popup */}
            {selectedDay && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg">
                        <h2 className="text-lg font-bold mb-4">
                            Add details for {selectedDay} {monthNames[month]} {year}
                        </h2>
                        <button
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={closePopup}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Year Popup */}
            {showYearPopup && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg">
                        <h2 className="text-lg font-bold mb-4">Select Year</h2>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => handleYearChange(Number(e.target.value))}
                            className="border p-2 rounded w-full"
                        />
                        <button
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => setShowYearPopup(false)}
                        >
                            {isChanged ? "Change" : "Close"}
                        </button>
                    </div>
                </div>
            )}

            {/* Month Popup */}
            {showMonthPopup && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg">
                        <h2 className="text-lg font-bold mb-4">Select Month</h2>
                        <select
                            value={month}
                            onChange={(e) => handleMonthChange(Number(e.target.value))}
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
                            onClick={() => setShowMonthPopup(false)}
                        >
                            {isChanged ? "Change" : "Close"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
