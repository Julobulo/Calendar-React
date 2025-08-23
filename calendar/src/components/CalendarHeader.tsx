import React, { SetStateAction } from "react";
import { monthNames } from "../utils/helpers";

interface CalendarHeaderProps {
    goToDate: (date: Date, options?: { stayOnMonth?: boolean }) => void;
    selectedDate: Date;
    popupState: { type: "year" | "month" | null; position: { top: number; left: number; width: number; height: number; } | null; };
    setPopupState: React.Dispatch<SetStateAction<{ type: "year" | "month" | null; position: { top: number; left: number; width: number; height: number; } | null; }>>;
    tempMonth: number;
    setTempMonth: React.Dispatch<SetStateAction<number>>;
    tempYear: number;
    setTempYear: React.Dispatch<SetStateAction<number>>;
    popupRef: React.RefObject<HTMLDivElement>;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ goToDate, selectedDate, popupState, setPopupState, tempMonth, setTempMonth, tempYear, setTempYear, popupRef }) => {
    const goToToday = () => goToDate(new Date(), { stayOnMonth: true });


    const showPopupNextToButton = (event: React.MouseEvent, popupType: "year" | "month") => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTempYear(selectedDate.getFullYear());
        setTempMonth(selectedDate.getMonth());
        setPopupState({ type: popupType, position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: popupState.position?.width as number, height: popupState.position?.height as number } });
    };
    const applyDateChange = () => {
        goToDate(new Date(tempYear, tempMonth, 1), { stayOnMonth: true });
        setPopupState({ type: null, position: popupState.position });
        console.log(`applied date change to ${tempYear}-${tempMonth}`)
    };

    return (
        <div>
            <div className="mb-4 flex justify-center space-x-4" >
                <button
                    className="text-xl font-bold"
                    onClick={(e) => showPopupNextToButton(e, "month")}
                >
                    {monthNames[selectedDate.getMonth()]}
                </button>
                <button
                    className="text-xl font-bold"
                    onClick={(e) => showPopupNextToButton(e, "year")}
                >
                    {selectedDate.getFullYear()}
                </button>
                <button
                    className="text-xl font-bold bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={goToToday}
                >
                    Today
                </button>
            </div>
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
    )
}