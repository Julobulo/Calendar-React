import { useState, useRef, useEffect } from "react";

export function useCalendarPopup(applyDateChange: () => void) {
  const [popupState, setPopupState] = useState<{
    type: "year" | "month" | null;
    position: { top: number; left: number; width: number; height: number } | null;
  }>({ type: null, position: null });

  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setPopupState({ type: null, position: null });
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        applyDateChange();
        // setPopupState({ type: null, position: null });
      }
    }

    if (popupState.type) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popupState.type, applyDateChange]);

  return { popupState, setPopupState, popupRef };
}
