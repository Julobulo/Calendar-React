import { useState, useRef } from "react";

type SuggestionType = "activity" | "name" | "variable" | "";

export function useSuggestions({ colors, names, eventPopUp, setEventPopUp, selectedForm }: any) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [cursorPosition, setCursorPosition] = useState<number>(0);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const suggestionsTypeRef = useRef<SuggestionType>("");
    const [query, setQuery] = useState("");

    const setSuggestionsType = (value: SuggestionType) => {
        suggestionsTypeRef.current = value;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const value = e.target.value;
        setQuery(value);
        let filteredSuggestions: Array<string> = [];
        if (selectedForm === "activity") {
            if (suggestionsTypeRef.current === "activity") {
                setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, activity: value }));

                if (value.length === 0) {
                    setSuggestions([]);
                    return;
                }

                filteredSuggestions = Object.keys(colors.activities)
                    .filter((key) => key.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 3);
            }
            else if (suggestionsTypeRef.current === "name") {
                setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, description: value }));

                if (value.length === 0) {
                    setSuggestions([]);
                    return;
                }
                const cursorPos = e.target.selectionStart || 0;
                setCursorPosition(cursorPos);
                const textBeforeCursor = value.slice(0, cursorPos);
                const match = textBeforeCursor.match(/@([a-zA-Z]*)$/);
                setQuery(match ? match[1] : "");

                if (match) {
                    filteredSuggestions = names
                        .filter((name: string) => name.toLowerCase().includes(match[1].toLowerCase()))
                        .slice(0, 3);
                }
            }
        } else if (selectedForm === "note") {
            setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, note: value }));
            if (value.length === 0) {
                setSuggestions([]);
                return;
            }
            const cursorPos = e.target.selectionStart || 0;
            setCursorPosition(cursorPos);
            const textBeforeCursor = value.slice(0, cursorPos);
            const match = textBeforeCursor.match(/@([a-zA-Z]*)$/);
            setQuery(match ? match[1] : "");

            if (match) {
                filteredSuggestions = names
                    .filter((name: string) => name.toLowerCase().includes(match[1].toLowerCase()))
                    .slice(0, 3);
            }
        } else if (selectedForm === "variable") {
            if (suggestionsTypeRef.current === "variable") {
                setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, variable: value }));

                if (value.length === 0) {
                    setSuggestions([]);
                    return;
                }

                filteredSuggestions = Object.keys(colors.variables)
                    .filter((key) => key.toLowerCase().includes(value.toLowerCase()))
                    .slice(0, 3);
            }
            // else if (suggestionsTypeRef.current === "name") {
            //     setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, value: value }));
            // }
        }

        setSuggestions(filteredSuggestions);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault(); // Prevents the cursor from moving
            setSelectedSuggestionIndex((prev) =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            if (selectedSuggestionIndex !== -1) e.preventDefault(); // Prevents the cursor from moving
            if (selectedSuggestionIndex > 0) {
                setSelectedSuggestionIndex((prevIndex) => prevIndex - 1);
            } else {
                // Stop selecting suggestions if already at the top
                setSelectedSuggestionIndex(-1);
            }
        } else if (e.key === "Enter" && selectedSuggestionIndex !== -1) {
            e.preventDefault(); // Prevents the cursor from moving
            if (selectedForm === "activity") {
                if (suggestionsTypeRef.current === "activity") {
                    setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, activity: suggestions[selectedSuggestionIndex] }));
                }
                else if (suggestionsTypeRef.current === "name") {
                    const textBeforeCursor = eventPopUp.description.slice(0, cursorPosition);
                    setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, description: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestions[selectedSuggestionIndex]}`) + eventPopUp.description.slice(cursorPosition) }));
                }
            } else if (selectedForm === "note") {
                const textBeforeCursor = eventPopUp.note.slice(0, cursorPosition);
                setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, note: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestions[selectedSuggestionIndex]}`) + eventPopUp.note.slice(cursorPosition) }));
            } else if (suggestionsTypeRef.current === "variable") {
                setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, variable: suggestions[selectedSuggestionIndex] }));
            }
            setSuggestions([]);
            setSelectedSuggestionIndex(-1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (selectedForm === "activity") {
            if (suggestionsTypeRef.current === "activity") {
                setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, activity: suggestion }));
            }
            else if (suggestionsTypeRef.current === "name") {
                const textBeforeCursor = eventPopUp.description.slice(0, cursorPosition);
                setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, description: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestion}`) + eventPopUp.description.slice(cursorPosition) }));
            }
        } else if (selectedForm === "note") {
            const textBeforeCursor = eventPopUp.note.slice(0, cursorPosition);
            setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, note: textBeforeCursor.replace(/@([a-zA-Z]*)$/, `@${suggestion}`) + eventPopUp.note.slice(cursorPosition) }));
        } else if (selectedForm === "variable") {
            setEventPopUp((prev: typeof eventPopUp) => ({ ...prev, variable: suggestion }));
        }
        setSuggestions([]);
    };

    return {
        suggestions,
        cursorPosition,
        selectedSuggestionIndex,
        suggestionsTypeRef,
        query,
        setSuggestions,
        setSelectedSuggestionIndex,
        setSuggestionsType,
        handleInputChange,
        handleKeyDown,
        handleSuggestionClick
    };
}
