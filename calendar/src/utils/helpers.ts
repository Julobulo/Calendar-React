// import { intervalToDuration } from "date-fns";

export const isLightOrDark = (hex: string): boolean => {
    if (!hex) return true;
    hex = hex.replace('#', '');

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luminance > 128;
};

export const getHumanTimeFromMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    let ret = '';
    if (hours !== 0) ret += `${hours}h`;
    if (remainingMinutes !== 0) ret += `${remainingMinutes}min`;
    return ret;
};

export const getTotalMinutesFromPattern = (pattern: string): number => {
    // Split the pattern by 'h' and 'min'
    const parts = pattern.split('h').map(part => part.split('min')[0]);

    // Extract hours and minutes
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;

    // If there's no 'min', it's just hours
    if (pattern.includes('min') && !parts[1]) {
        return hours;
    }

    // Calculate total minutes
    return (hours * 60) + minutes;
}

export const identifyTimePatterns = (inputString: string) => {
    const patterns = [];

    // Regular expression to match the specified time patterns
    const timeRegex = /(\d{1,2})h\s*(\d{1,2})?min?|\b(\d{1,2})min\b|\b(\d{1,2})h\b/g;

    // Match time patterns in the input string
    let match;
    while ((match = timeRegex.exec(inputString)) !== null) {
        const timePattern = match[0];
        patterns.push(timePattern);
    }
    console.log("Here are the patterns that are going to be returned:", patterns);
    return patterns;
}

export const getTimeFromLongString = (input: string): number => {
    // Identify time patterns in the activity string
    const timePatterns = identifyTimePatterns(input);
    let totalMinutes = 0;

    // Calculate total minutes from each time pattern and sum them up
    timePatterns.forEach(pattern => {
        totalMinutes += getTotalMinutesFromPattern(pattern);
    });

    return totalMinutes;
}

export const getDiffBetweenTimes = (start: string, end: string): number => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const diff = endMinutes - startMinutes;
    return diff
}

export const getHumanReadableDiffBetweenTimes = (start: string, end: string): string => {
    let diff = getDiffBetweenTimes(start, end)

    if (diff < 0) diff += 24 * 60; // handle overnight

    return getHumanTimeFromMinutes(diff);
}

export const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const generateRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
}

type Duration = {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
};

export function intervalToDuration({
    start,
    end,
}: {
    start: number | Date;
    end: number | Date;
}): Duration {
    const startMs = start instanceof Date ? start.getTime() : start;
    const endMs = end instanceof Date ? end.getTime() : end;

    let diff = Math.max(0, endMs - startMs); // prevent negative

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return {
        years: 0, // keep simple, not breaking down into months/years
        months: 0,
        days: days % 365,
        hours: hours % 24,
        minutes: minutes % 60,
        seconds: seconds % 60,
    };
}

// Function to format total time (in minutes) into a more comprehensive format like: "1 year 2 months 3 days 4 hours 5 minutes"
export const formatTime = (minutes: number) => {
    // Convert minutes to milliseconds for intervalToDuration
    const duration = intervalToDuration({
        start: 0,
        end: minutes * 60 * 1000, // Convert minutes to milliseconds
    });

    // Format the duration into a readable string
    const parts = [];
    if (duration.years) parts.push(`${duration.years} year${duration.years > 1 ? "s" : ""}`);
    if (duration.months) parts.push(`${duration.months} month${duration.months > 1 ? "s" : ""}`);
    if (duration.days) parts.push(`${duration.days} day${duration.days > 1 ? "s" : ""}`);
    if (duration.hours) parts.push(`${duration.hours} hour${duration.hours > 1 ? "s" : ""}`);
    if (duration.minutes) parts.push(`${duration.minutes} minute${duration.minutes > 1 ? "s" : ""}`);
    if (duration.seconds) parts.push(`${duration.seconds} second${duration.seconds > 1 ? "s" : ""}`);

    // Join the parts into a final string
    return parts.join(" ") || "0 minutes";
};

export const highlightTimesAndNames = (description: string): string => {
    let newDescription;
    const timeRegex = /(\d{1,2})h\s*(\d{1,2})?min?|\b(\d{1,2})min\b|\b(\d{1,2})h\b/g;
    newDescription = description.replace(timeRegex, (match) => {
        return `<span style="text-decoration: underline;">${match}</span>`;
    });
    return newDescription.replace(/@(\w+)/g, (match) => {
        return `<span style="font-weight: bold;">${match}</span>`;
    });
};


export const dateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};
