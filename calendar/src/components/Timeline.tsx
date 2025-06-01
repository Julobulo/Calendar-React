import React from 'react';

type Stay = {
  location: string;
  start: string; // ISO date
  end: string;   // ISO date
  color?: string;
};

type Props = {
  stays: Stay[];
  onDateSelect: (date: string) => void;
};

// Helper to get days between two dates
const daysBetween = (start: Date, end: Date) => {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

// Helper to add days to a date
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const Timeline: React.FC<Props> = ({ stays, onDateSelect }) => {
  const startDates = stays.map(s => new Date(s.start));
  const endDates = stays.map(s => new Date(s.end));
  const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));
  const totalDays = daysBetween(minDate, maxDate) + 1;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const daysFromStart = Math.floor(ratio * totalDays);
    const selectedDate = addDays(minDate, daysFromStart).toISOString().split('T')[0];
    onDateSelect(selectedDate);
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-full h-10 cursor-pointer border border-gray-300"
    >
      {stays.map((stay, i) => {
        const start = new Date(stay.start);
        const end = new Date(stay.end);
        const offset = daysBetween(minDate, start);
        const width = daysBetween(start, end) + 1;
        const leftPercent = (offset / totalDays) * 100;
        const widthPercent = (width / totalDays) * 100;

        return (
          <div
            key={i}
            className="absolute top-0 bottom-0 text-xs text-white flex items-center justify-center"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              backgroundColor: stay.color || '#3b82f6',
              // borderRight: '1px solid white',
            }}
          >
            {/* {stay.location} */}
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
