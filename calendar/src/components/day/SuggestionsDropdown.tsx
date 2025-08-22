import React from "react";

interface SuggestionsDropdownProps {
    suggestions: string[];
    selectedIndex: number;
    onMouseEnter: (index: number) => void;
    onMouseLeave: () => void;
    onClick: (suggestion: string) => void;
}

export const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
    suggestions,
    selectedIndex,
    onMouseEnter,
    onMouseLeave,
    onClick
}) => {
    if (suggestions.length === 0) return null;

    return (
        <ul className="mt-1 bg-white border rounded shadow-lg">
            {suggestions.map((s, idx) => (
                <li
                    key={s}
                    className={`p-2 cursor-pointer ${idx === selectedIndex ? "bg-gray-300" : "hover:bg-gray-200"}`}
                    onMouseEnter={() => onMouseEnter(idx)}
                    onMouseLeave={onMouseLeave}
                    onClick={() => onClick(s)}
                >
                    {s}
                </li>
            ))}
        </ul>
    );
};
