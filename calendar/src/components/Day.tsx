import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const Day = () => {
    const [searchParams] = useSearchParams();
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const day = searchParams.get("day");

    useEffect(() => {
        console.log(`year: ${year}, month: ${month}, day: ${day}`);
    }, [year, month, day]);

    return (
        <div>
            day component for year: {year}, month: {month}, day: {day}.
        </div>
    );
};

export default Day;