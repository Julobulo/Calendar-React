import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import Timeline from '../statistics/Timeline';

const userIcon = new L.DivIcon({
    className: 'custom-person-icon',
    html: `
  <div style="
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
<g id="surface1">
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(89.803922%,92.156863%,100%);fill-opacity:1;" d="M 11.429688 0.367188 C 11.46875 0.363281 11.511719 0.363281 11.554688 0.363281 C 13.328125 0.355469 13.328125 0.355469 14.109375 0.515625 C 14.179688 0.53125 14.179688 0.53125 14.25 0.542969 C 16.910156 1.105469 19.488281 2.53125 21.140625 4.734375 C 21.175781 4.78125 21.175781 4.78125 21.210938 4.828125 C 21.5625 5.296875 21.886719 5.769531 22.171875 6.28125 C 22.191406 6.3125 22.210938 6.347656 22.226562 6.382812 C 23.082031 7.898438 23.625 9.675781 23.632812 11.429688 C 23.636719 11.46875 23.636719 11.511719 23.636719 11.554688 C 23.644531 13.328125 23.644531 13.328125 23.484375 14.109375 C 23.46875 14.179688 23.46875 14.179688 23.457031 14.25 C 22.796875 17.371094 20.996094 20.054688 18.328125 21.8125 C 18.128906 21.9375 17.925781 22.054688 17.71875 22.171875 C 17.6875 22.191406 17.652344 22.210938 17.617188 22.226562 C 16.101562 23.082031 14.324219 23.625 12.570312 23.632812 C 12.507812 23.636719 12.507812 23.636719 12.445312 23.636719 C 10.671875 23.644531 10.671875 23.644531 9.890625 23.484375 C 9.820312 23.46875 9.820312 23.46875 9.75 23.457031 C 6.632812 22.796875 3.9375 20.996094 2.1875 18.328125 C 2.0625 18.128906 1.945312 17.925781 1.828125 17.71875 C 1.8125 17.6875 1.792969 17.660156 1.777344 17.628906 C 0.910156 16.113281 0.378906 14.320312 0.363281 12.570312 C 0.363281 12.527344 0.363281 12.484375 0.363281 12.4375 C 0.355469 11.496094 0.363281 10.582031 0.5625 9.65625 C 0.574219 9.609375 0.582031 9.5625 0.59375 9.511719 C 0.976562 7.738281 1.769531 6.101562 2.90625 4.6875 C 2.929688 4.660156 2.949219 4.632812 2.972656 4.605469 C 3.492188 3.964844 4.074219 3.355469 4.734375 2.859375 C 4.765625 2.835938 4.796875 2.8125 4.828125 2.789062 C 5.296875 2.4375 5.769531 2.113281 6.28125 1.828125 C 6.3125 1.8125 6.339844 1.792969 6.371094 1.777344 C 7.882812 0.910156 9.679688 0.375 11.429688 0.367188 Z M 11.429688 0.367188 "/>
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(25.882354%,58.039218%,100%);fill-opacity:1;" d="M 12.609375 14.25 C 12.648438 14.25 12.683594 14.25 12.722656 14.25 C 13.589844 14.261719 14.507812 14.441406 15.328125 14.71875 C 15.367188 14.730469 15.40625 14.742188 15.445312 14.757812 C 16.964844 15.253906 18.332031 15.96875 19.546875 17.015625 C 19.582031 17.046875 19.617188 17.078125 19.65625 17.109375 C 20.160156 17.550781 20.652344 18.023438 21.066406 18.550781 C 21.089844 18.578125 21.109375 18.605469 21.132812 18.632812 C 21.335938 18.894531 21.335938 18.894531 21.328125 19.03125 C 21.253906 19.136719 21.183594 19.226562 21.101562 19.320312 C 21.074219 19.34375 21.050781 19.371094 21.027344 19.398438 C 20.980469 19.457031 20.929688 19.511719 20.882812 19.5625 C 20.820312 19.628906 20.765625 19.695312 20.707031 19.761719 C 19.851562 20.734375 18.847656 21.539062 17.71875 22.171875 C 17.6875 22.191406 17.652344 22.210938 17.617188 22.226562 C 16.101562 23.082031 14.324219 23.625 12.570312 23.632812 C 12.507812 23.636719 12.507812 23.636719 12.445312 23.636719 C 10.671875 23.644531 10.671875 23.644531 9.890625 23.484375 C 9.84375 23.476562 9.796875 23.464844 9.75 23.457031 C 7.050781 22.886719 4.570312 21.449219 2.859375 19.265625 C 2.824219 19.226562 2.789062 19.1875 2.75 19.144531 C 2.671875 19.03125 2.671875 19.03125 2.675781 18.933594 C 2.832031 18.605469 3.121094 18.332031 3.367188 18.066406 C 3.457031 17.964844 3.546875 17.863281 3.636719 17.757812 C 3.769531 17.601562 3.914062 17.46875 4.070312 17.335938 C 4.179688 17.242188 4.28125 17.148438 4.386719 17.050781 C 5.738281 15.835938 7.4375 15.019531 9.1875 14.578125 C 9.222656 14.570312 9.257812 14.558594 9.292969 14.550781 C 10.386719 14.269531 11.484375 14.222656 12.609375 14.25 Z M 12.609375 14.25 "/>
<path style=" stroke:none;fill-rule:nonzero;fill:rgb(25.882354%,58.039218%,100%);fill-opacity:1;" d="M 13.3125 3.9375 C 13.394531 3.960938 13.394531 3.960938 13.480469 3.988281 C 14.175781 4.210938 14.726562 4.59375 15.234375 5.109375 C 15.273438 5.144531 15.308594 5.183594 15.347656 5.222656 C 16.171875 6.078125 16.527344 7.230469 16.523438 8.398438 C 16.492188 9.621094 15.941406 10.671875 15.09375 11.53125 C 15.058594 11.566406 15.027344 11.601562 14.992188 11.636719 C 14.535156 12.070312 13.957031 12.375 13.359375 12.5625 C 13.300781 12.582031 13.242188 12.597656 13.183594 12.617188 C 12.074219 12.9375 10.855469 12.777344 9.84375 12.234375 C 9.460938 12.011719 9.132812 11.742188 8.8125 11.4375 C 8.785156 11.414062 8.757812 11.386719 8.726562 11.363281 C 7.996094 10.695312 7.554688 9.589844 7.492188 8.613281 C 7.441406 7.351562 7.757812 6.238281 8.605469 5.28125 C 8.671875 5.207031 8.742188 5.136719 8.8125 5.0625 C 8.835938 5.035156 8.863281 5.007812 8.886719 4.976562 C 9.960938 3.800781 11.84375 3.457031 13.3125 3.9375 Z M 13.3125 3.9375 "/>
</g>
</svg>
  </div>
`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

interface Location {
    name: string;
    lat: number;
    lng: number;
    date: string;
}

interface Props {
    locations: Location[];
}

interface Stay {
    location: string;
    lat: number;
    lng: number;
    start: string;
    end: string;
    color?: string;
}

interface UniqueLocation {
    name: string | null;
    lat: number;
    lng: number;
    count: number; // total number of days stayed
}

const MapAnimation = ({ locations }: Props) => {
    const [planePosition, setPlanePosition] = useState<[number, number] | null>(null);
    const [barOffset, setBarOffset] = useState(0);
    const [currentDate, setCurrentDate] = useState('');
    const [uniqueLocations, setUniqueLocations] = useState<UniqueLocation[]>();
    const [stays, setStays] = useState<Stay[]>([]);

    function generateStays(locations: Location[]): Stay[] {
        if (!locations.length) return [];

        // Sort locations chronologically
        const sorted = [...locations].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const stays: Stay[] = [];
        let i = 0;

        while (i < sorted.length) {
            const current = sorted[i];
            const start = current.date;
            const lat = current.lat;
            const lng = current.lng;
            const location = current.name || null;
            let j = i + 1;

            while (
                j < sorted.length &&
                sorted[j].lat === lat &&
                sorted[j].lng === lng
            ) {
                j++;
            }

            const end = j < sorted.length
                ? new Date(new Date(sorted[j].date).getTime() - 86400000).toISOString().split("T")[0]
                : sorted[sorted.length - 1].date;

            stays.push({
                location: location || '',
                lat,
                lng,
                start,
                end,
            });

            i = j;
        }

        return stays;
    }

    function countDaysPerLocation(stays: Stay[]): UniqueLocation[] {
        const locationMap = new Map<string, UniqueLocation>();

        stays.forEach((stay) => {
            const key = `${stay.lat},${stay.lng}`;
            const startDate = new Date(stay.start);
            const endDate = new Date(stay.end);

            // Calculate number of days in this stay (inclusive)
            const days =
                Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            if (!locationMap.has(key)) {
                locationMap.set(key, {
                    name: stay.location,
                    lat: stay.lat,
                    lng: stay.lng,
                    count: days,
                });
            } else {
                const existing = locationMap.get(key)!;
                existing.count += days;
            }
        });

        return Array.from(locationMap.values());
    }
const daysBetween = (start: Date, end: Date) => {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};
    useEffect(() => {
        if (!locations.length) return;
        const stays: Stay[] = generateStays(locations);
        setStays(stays);
        console.log(`stays: ${JSON.stringify(stays)}`);
        setUniqueLocations(countDaysPerLocation(stays));
        if (!locations.length || !stays.length) return;
        const sortedStays = [...stays].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        const minDate = new Date(sortedStays[0].start);
        const maxDate = new Date(sortedStays[sortedStays.length - 1].end);
        const totalDays = daysBetween(minDate, maxDate) + 1;

        let index = 0;
        const interval = setInterval(() => {
            if (index < stays.length) {
                const stay = stays[index];
                setPlanePosition([stay.lat, stay.lng]);
                setCurrentDate(new Date(stay.start).toDateString());

                const startOffsetDays = daysBetween(minDate, new Date(stay.start));
                const offsetPercent = (startOffsetDays / totalDays) * 100;
                setBarOffset(offsetPercent);

                console.log(`stay location: ${stay.location}, start date: ${stay.start}, end date: ${stay.end}`)

                index++;
            } else {
                clearInterval(interval);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [locations])

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!locations.length || !stays.length) return;

        // 1. Get bounding info
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;

        // 2. Determine date range
        const sortedLocations = [...locations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const minDate = new Date(sortedLocations[0].date);
        const maxDate = new Date(sortedLocations[sortedLocations.length - 1].date);
        const totalMs = maxDate.getTime() - minDate.getTime();

        // 3. Calculate clicked date
        const clickedRatio = clickX / width;
        const clickedTime = minDate.getTime() + clickedRatio * totalMs;
        const clickedDateObj = new Date(clickedTime);
        const clickedDate = clickedDateObj.toISOString().split("T")[0];

        setCurrentDate(clickedDateObj.toDateString());

        // 4. Find stay that includes clicked date
        const stay = stays.find(s => clickedDate >= s.start && clickedDate <= s.end);
        console.log(`stay clicked: ${JSON.stringify(stay)}`)
        if (stay) {
            const matchingLoc = locations.find(loc => loc.name === stay.location && loc.date === stay.start);
            if (matchingLoc) {
                setPlanePosition([matchingLoc.lat, matchingLoc.lng]);
            }
        }

        // 5. Update bar offset
        const offsetPercent = ((clickedDateObj.getTime() - minDate.getTime()) / totalMs) * 100;
        setBarOffset(offsetPercent);
    };

    if (!locations.length || !stays.length) return null;

    return (
        <div className="relative" style={{ height: '400px' }}>
            <div className="absolute top-0 left-0 w-full z-[1000] bg-white/80" onClick={(e) => handleTimelineClick(e)}>
                <div className="text-center text-sm font-semibold pt-1">
                    {currentDate} - {
                        (() => {
                            console.log(`click: current date: ${currentDate}`)
                            if (currentDate) {
                                const targetDate = new Date(currentDate);
                                targetDate.setHours(0, 0, 0, 0);

                                const stay = stays.find(s => {
                                    const start = new Date(s.start);
                                    const end = new Date(s.end);
                                    start.setHours(0, 0, 0, 0);
                                    end.setHours(0, 0, 0, 0);
                                    return targetDate >= start && targetDate <= end;
                                });

                                return stay ? stay.location : "No location name";
                            }
                        })()
                    }
                </div>
                <div
                    className="absolute top-0 bottom-0 w-[1px] bg-red-600 transition-all duration-500"
                    style={{ left: `${barOffset}%` }}
                ></div>
                <Timeline
                    stays={stays}
                    onDateSelect={(date) => console.log('Selected date:', date)}
                />
            </div>
            <MapContainer
                center={[locations[0].lat, locations[0].lng]}
                zoom={3}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {uniqueLocations && uniqueLocations.map((loc, i) => (
                    <Marker key={i} position={[loc.lat, loc.lng]}>
                        <Tooltip>{`${loc.name}: logged ${loc.count} time${loc.count > 1 ? 's' : ''}`}</Tooltip>
                    </Marker>
                ))}
                {planePosition && <Marker position={planePosition} icon={userIcon} />}
            </MapContainer>
        </div>
    );
};

export default MapAnimation;
