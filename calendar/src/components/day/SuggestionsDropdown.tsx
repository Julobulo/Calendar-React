import React from "react";

interface SuggestionsDropdownProps {
    suggestions: string[];
    selectedIndex: number;
    onMouseEnter: (index: number) => void;
    onMouseLeave: () => void;
    onClick: (suggestion: string) => void;
    query: string;
}

export const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
    suggestions,
    selectedIndex,
    onMouseEnter,
    onMouseLeave,
    onClick,
    query
}) => {
    if (suggestions.length === 0) return null;

    const highlightMatch = (text: string) => {
        if (!query) return text;

        const regex = new RegExp(`(${query})`, "ig");
        const parts = text.split(regex);

        return parts.map((part, i) =>
            regex.test(part) ? (
                <span key={i} className="bg-purple-300">
                    {part}
                </span>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };

    return (
        <ul className="mt-1 bg-white border rounded shadow-lg">
            {suggestions.map((s, idx) => (
                <li
                    key={s}
                    className={`p-2 cursor-pointer ${
                        idx === selectedIndex
                            ? "bg-gray-300"
                            : "hover:bg-gray-200"
                    }`}
                    onMouseEnter={() => onMouseEnter(idx)}
                    onMouseLeave={onMouseLeave}
                    onClick={() => onClick(s)}
                >
                    {highlightMatch(s)}
                </li>
            ))}
        </ul>
    );
};
