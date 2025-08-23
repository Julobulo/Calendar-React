import React from "react";
import { getHumanReadableDiffBetweenTimes, isLightOrDark } from "../utils/helpers";
import { VscSymbolVariable } from "react-icons/vsc";
import { LuNotebookPen } from "react-icons/lu";
import { Colors, NewUserActivity } from "../utils/types";
type FrontendUserActivity = Omit<NewUserActivity, "userId">;

interface DayCellProps {
    // day: number,
    month: number,
    year: number,
    activities: FrontendUserActivity[],
    colors: Colors,
    goToDate: (date: Date, options?: { stayOnMonth?: boolean; }) => void,
    i: number,
}

export const DayCell: React.FC<DayCellProps> = ({ month, year, activities, colors, goToDate, i }) => {
    const handleDayClick = (day: number) => {
        goToDate(new Date(year, month, day))
    };

    const DayActivities = () => {
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
                    {entry.activity} - {getHumanReadableDiffBetweenTimes(entry.start || "", entry.end || "")}
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
                    <LuNotebookPen className="text-sm" />
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
                            // onClick={() => handleMoreActivitesClick(day)}
                            onClick={() => handleDayClick(day)}
                        >
                            + {hiddenItems} more
                        </button>
                    )}
                </div>
            </div>
        );
    }

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
                    {DayActivities()}
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    {/* Regular day number */}
                    <div>{day}</div>
                    {DayActivities()}
                </div>
            )}
        </div>
    );
}