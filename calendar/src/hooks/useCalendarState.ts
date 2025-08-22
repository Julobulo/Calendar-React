import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function useCalendarState() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialYear = searchParams.get("year") 
    ? Number(searchParams.get("year")) 
    : new Date().getFullYear();

  const initialMonth = searchParams.get("month") 
    ? Number(searchParams.get("month")) 
    : new Date().getMonth();

  const initialDay = searchParams.get("day") 
    ? Number(searchParams.get("day")) 
    : new Date().getDate();

  const [selectedDate, setSelectedDate] = useState(
    new Date(initialYear, initialMonth, initialDay)
  );
  const [currentMonth, setCurrentMonth] = useState(
    new Date(initialYear, initialMonth, 1)
  );

  useEffect(() => {
    localStorage.setItem("day", selectedDate.getDate().toString());
    localStorage.setItem("month", selectedDate.getMonth().toString());
    localStorage.setItem("year", selectedDate.getFullYear().toString());
  }, [selectedDate]);

  const goToDate = (date: Date, options?: { stayOnMonth?: boolean }) => {
  setSelectedDate(date);
  setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));

  if (options?.stayOnMonth) {
    navigate(`/calendar?year=${date.getFullYear()}&month=${date.getMonth()}`);
  } else {
    navigate(
      `/calendar/day?year=${date.getFullYear()}&month=${date.getMonth()}&day=${date.getDate()}`
    );
  }
};


  return { selectedDate, currentMonth, setCurrentMonth, goToDate };
}
