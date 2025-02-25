export const isLightOrDark = (hex: string): boolean => {
    if (!hex) return false;
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