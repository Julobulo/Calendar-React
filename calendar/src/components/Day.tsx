import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Day = () => {
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const params = useParams();
    useEffect(() => {
            setYear(params.year);
            setMonth(params.month);
            setDay(params.day);
            console.log(`params: ${JSON.stringify(params)}`);
        }, [params]);
    
    return (
        <div>
            day component for year: {year}, month: {month}, day: {day}.
        </div>
    )
}

export default Day;