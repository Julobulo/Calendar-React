import React from "react";
import Spinner from "../Spinner";
import { MdDelete } from "react-icons/md";
import { useSuggestions } from "../../hooks/useSuggestions";

interface EventFormProps {
    calendarWidth: number | null;
    selectedForm: "activity" | "note" | "variable";
    eventPopUp: any;
    setEventPopUp: (value: any) => void;
    suggestionsHook: ReturnType<typeof useSuggestions>;
    actionLoading: boolean;
    handleEventFinish: () => Promise<void>;
    handleDelete: () => Promise<void>;
    handleClose: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
    calendarWidth,
    selectedForm,
    eventPopUp,
    setEventPopUp,
    suggestionsHook,
    actionLoading,
    handleEventFinish,
    handleDelete,
    handleClose
}) => {

    const formWidth = calendarWidth ? `${calendarWidth}px` : "auto";

    return (
        <div className="relative">
            <div className="p-4 border rounded mr-0 lg:mr-2 xl:mr-14" style={{ width: formWidth }}>
                <h3 className="text-lg font-semibold">{eventPopUp.state} {selectedForm}</h3>

                {/* Activity Form */}
                {selectedForm === "activity" && (
                    <>
                        <input
                            type="text"
                            placeholder="Activity"
                            className="w-full p-2 border rounded"
                            value={eventPopUp.activity}
                            onChange={(e) => { suggestionsHook.setSuggestionsType("activity"); suggestionsHook.handleInputChange(e); }}
                            onKeyDown={suggestionsHook.handleKeyDown}
                            disabled={eventPopUp.state !== "add"}
                        />
                        {/* Suggestion dropdown */}
                        {suggestionsHook.suggestions.length > 0 && suggestionsHook.suggestionsTypeRef?.current === "activity" && (
                            <ul className="bg-white border rounded shadow-lg">
                                {suggestionsHook.suggestions.map((s, idx) => (
                                    <li key={s} className={`p-2 cursor-pointer ${idx === suggestionsHook.selectedSuggestionIndex ? "bg-gray-300" : "hover:bg-gray-200"}`}
                                        onMouseEnter={() => suggestionsHook.setSelectedSuggestionIndex(idx)}
                                        onMouseLeave={() => suggestionsHook.setSelectedSuggestionIndex(-1)}
                                        onClick={() => suggestionsHook.handleSuggestionClick(s)}
                                    >
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <input type="time" value={eventPopUp.start} onChange={(e) => setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, start: e.target.value }))} className="w-full p-2 border mt-2 rounded" />
                        <input type="time" value={eventPopUp.end} onChange={(e) => setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, end: e.target.value }))} className="w-full p-2 border mt-2 rounded" />
                        <textarea
                            placeholder="Description"
                            value={eventPopUp.description}
                            className="w-full p-2 border mt-2 rounded"
                            onChange={(e) => { suggestionsHook.setSuggestionsType("name"); suggestionsHook.handleInputChange(e); }}
                            onKeyDown={suggestionsHook.handleKeyDown}
                        ></textarea>
                    </>
                )}

                {/* Note Form */}
                {selectedForm === "note" && (
                    <textarea
                        placeholder="Note for the day"
                        className="w-full p-2 border mt-2 rounded"
                        value={eventPopUp.note}
                        onChange={(e) => suggestionsHook.handleInputChange(e)}
                        onKeyDown={suggestionsHook.handleKeyDown}
                    ></textarea>
                )}

                {/* Variable Form */}
                {selectedForm === "variable" && (
                    <>
                        <input
                            type="text"
                            placeholder="Variable"
                            className="w-full p-2 border rounded"
                            value={eventPopUp.variable}
                            onChange={(e) => { suggestionsHook.setSuggestionsType("variable"); suggestionsHook.handleInputChange(e); }}
                            onKeyDown={suggestionsHook.handleKeyDown}
                            disabled={eventPopUp.state !== "add"}
                        />
                        <input
                            type="number"
                            placeholder="Value"
                            className="w-full p-2 border mt-2 rounded"
                            value={eventPopUp.value}
                            onChange={(e) => { suggestionsHook.setSuggestionsType("name"); suggestionsHook.handleInputChange(e); }}
                        />
                    </>
                )}

                {/* Action buttons */}
                {actionLoading ? (
                    <div className="w-full flex justify-center p-2 bg-blue-300 text-white rounded mt-2">
                        <Spinner />
                    </div>
                ) : (
                    <div className="flex gap-2 mt-2">
                        <button className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleEventFinish}>
                            {eventPopUp.state}
                        </button>
                        {eventPopUp.state !== "add" && (
                            <button className="w-12 h-10 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600" onClick={handleDelete}>
                                <MdDelete className="text-xl" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <button onClick={handleClose} className="absolute top-2 right-2 text-gray-600 block md:hidden">✕</button>
        </div>
    );
};
