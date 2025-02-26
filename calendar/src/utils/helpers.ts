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