import React from "react";
import Spinner from "../utils/Spinner";
import { MdDelete } from "react-icons/md";
import { useSuggestions } from "../../hooks/useSuggestions";
import { SuggestionsDropdown } from "./SuggestionsDropdown";

interface EventFormProps {
    calendarWidth: number | null;
    selectedForm: "activity" | "note" | "variable";
    eventPopUp: any;
    setEventPopUp: (value: any) => void;
    suggestionsHook: ReturnType<typeof useSuggestions>;
    actionLoading: boolean;
    handleEventFinish: () => Promise<void>;
    handleDelete: () => Promise<void>;
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
}) => {

    const formWidth = calendarWidth ? `${calendarWidth}px` : "auto";

    return (
        <div className="relative">
            <div className="p-4 border rounded mr-0 lg:mr-2 xl:mr-14" style={{ width: formWidth }}>
                <h3 className="text-lg font-semibold">{eventPopUp.state} {selectedForm}</h3>

                {/* Activity Form */}
                {selectedForm === "activity" && (
                    <div>
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
                            <SuggestionsDropdown
                                suggestions={suggestionsHook.suggestions}
                                selectedIndex={suggestionsHook.selectedSuggestionIndex}
                                onMouseEnter={suggestionsHook.setSelectedSuggestionIndex}
                                onMouseLeave={() => suggestionsHook.setSelectedSuggestionIndex(-1)}
                                onClick={suggestionsHook.handleSuggestionClick}
                                query={suggestionsHook.query}
                            />
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
                        {/* Suggestion dropdown */}
                        {suggestionsHook.suggestions.length > 0 && suggestionsHook.suggestionsTypeRef?.current === "name" && (
                            <SuggestionsDropdown
                                suggestions={suggestionsHook.suggestions}
                                selectedIndex={suggestionsHook.selectedSuggestionIndex}
                                onMouseEnter={suggestionsHook.setSelectedSuggestionIndex}
                                onMouseLeave={() => suggestionsHook.setSelectedSuggestionIndex(-1)}
                                onClick={suggestionsHook.handleSuggestionClick}
                                query={suggestionsHook.query}
                            />
                        )}
                    </div>
                )}

                {/* Note Form */}
                {selectedForm === "note" && (
                    <div>
                        <textarea
                            placeholder="Note for the day"
                            className="w-full p-2 border mt-2 rounded"
                            value={eventPopUp.note}
                            onChange={(e) => { suggestionsHook.setSuggestionsType("name"); suggestionsHook.handleInputChange(e) }}
                            onKeyDown={suggestionsHook.handleKeyDown}
                        ></textarea>
                        {/* Suggestion dropdown */}
                        {suggestionsHook.suggestions.length > 0 && suggestionsHook.suggestionsTypeRef?.current === "name" && (
                            <SuggestionsDropdown
                                suggestions={suggestionsHook.suggestions}
                                selectedIndex={suggestionsHook.selectedSuggestionIndex}
                                onMouseEnter={suggestionsHook.setSelectedSuggestionIndex}
                                onMouseLeave={() => suggestionsHook.setSelectedSuggestionIndex(-1)}
                                onClick={suggestionsHook.handleSuggestionClick}
                                query={suggestionsHook.query}
                            />
                        )}
                    </div>
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
                        {/* Suggestion dropdown */}
                        {suggestionsHook.suggestions.length > 0 && suggestionsHook.suggestionsTypeRef?.current === "variable" && (
                            <SuggestionsDropdown
                                suggestions={suggestionsHook.suggestions}
                                selectedIndex={suggestionsHook.selectedSuggestionIndex}
                                onMouseEnter={suggestionsHook.setSelectedSuggestionIndex}
                                onMouseLeave={() => suggestionsHook.setSelectedSuggestionIndex(-1)}
                                onClick={suggestionsHook.handleSuggestionClick}
                                query={suggestionsHook.query}
                            />
                        )}
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
        </div>
    );
};
