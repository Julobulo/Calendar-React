import React from "react";
import { isLightOrDark, getHumanReadableDiffBetweenTimes, highlightTimesAndNames } from "../../utils/helpers";

interface EventListProps {
    dayActivities: any;
    colors: any;
    setSelectedForm: (form: "activity" | "note" | "variable") => void;
    setEventPopUp: (value: any) => void;
    setMobileShowForm: (value: boolean) => void;
}

export const EventList: React.FC<EventListProps> = ({ dayActivities, colors, setSelectedForm, setEventPopUp, setMobileShowForm }) => {
    return (
        <div className="mt-2 flex flex-col space-y-2">
            {/* Activities */}
            {dayActivities.entries?.map((entry: any, index: number) => (
                <div
                    key={index}
                    style={{ backgroundColor: colors.activities[entry.activity] || "#ffffff" }}
                    className="rounded-2xl shadow-md"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedForm("activity");
                        setEventPopUp({ state: "edit", ...entry, note: "", variable: "", value: "" });
                        setMobileShowForm(true);
                    }}
                >
                    <div className={`p-4 text-left text-[14px] ${isLightOrDark(colors.activities[entry.activity]) ? "text-black" : "text-white"}`}>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-lg">{entry.activity}</h3>
                                <span className="text-sm opacity-90">({getHumanReadableDiffBetweenTimes(entry.start || "", entry.end || "")})</span>
                            </div>
                            {entry.start && <span className="text-sm opacity-80">{entry.start}</span>}
                        </div>
                        <p
                            className="text-sm leading-snug mt-1"
                            dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(entry.description) }}
                        ></p>
                    </div>
                </div>
            ))}

            {((dayActivities.entries?.length ?? 0) > 0 && dayActivities.variables?.length > 0) && <hr className="my-2" />}

            {/* Variables */}
            {dayActivities.variables?.map((entry: any, index: number) => (
                <div
                    key={index}
                    style={{ backgroundColor: colors.variables[entry.variable] || "#ffffff" }}
                    className={`text-[14px] ${isLightOrDark(colors.variables[entry.variable]) ? 'text-black' : 'text-white'} rounded px-2 py-1`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedForm("variable");
                        setEventPopUp({ state: "edit", _id: entry._id, variable: entry.variable, value: entry.value, activity: "", description: "", start: "", end: "", note: "" });
                        setMobileShowForm(true);
                    }}
                >
                    {entry.variable} - {entry.value}
                </div>
            ))}

            {(dayActivities.note && (dayActivities.entries?.length ?? 0) > 0 || (dayActivities.variables?.length ?? 0) > 0) && <hr className="my-2" />}

            {/* Note */}
            {dayActivities.note && (
                <div
                    style={{ backgroundColor: colors.note || "#ffffff" }}
                    className={`${isLightOrDark(colors.note) ? 'text-black' : 'text-white'} rounded px-2 py-1`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedForm("note");
                        setEventPopUp({ state: "edit", note: dayActivities.note, activity: "", description: "", start: "", end: "", variable: "", value: "" });
                        setMobileShowForm(true);
                    }}
                >
                    <span className="text-[14px]" dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(dayActivities.note) }}></span>
                </div>
            )}
        </div>
    );
};
