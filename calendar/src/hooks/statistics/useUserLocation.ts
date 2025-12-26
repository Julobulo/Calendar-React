import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export interface Location {
  name: string;
  lat: number;
  lng: number;
  date: string; // YYYY-MM-DD
}

export interface Stay {
  name: string;
  lat: number;
  lng: number;
  start: string;
  end: string;
}

export interface UniqueLocation {
  name: string;
  lat: number;
  lng: number;
  count: number;
}

export function useUserLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [uniqueLocations, setUniqueLocations] = useState<UniqueLocation[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/getAllLocations`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch locations");

        const data: Location[] = await res.json();
        setLocations(data);
      } catch {
        toast.error("Failed to fetch locations");
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (!locations.length) return;

    // Sort chronologically
    const sorted = [...locations].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Generate stays (consecutive same location = single stay)
    const tempStays: Stay[] = [];
    let current = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      const next = sorted[i];
      if (!next || next.lat !== current.lat || next.lng !== current.lng) {
        tempStays.push({
          name: current.name,
          lat: current.lat,
          lng: current.lng,
          start: current.date,
          end: sorted[i - 1].date,
        });
        current = next;
      }
    }

    setStays(tempStays);

    // Count days per unique location
    const locMap = new Map<string, UniqueLocation>();
    tempStays.forEach(stay => {
      const key = `${stay.lat},${stay.lng}`;
      const start = new Date(stay.start);
      const end = new Date(stay.end);
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (locMap.has(key)) {
        locMap.get(key)!.count += days;
      } else {
        locMap.set(key, {
          name: stay.name,
          lat: stay.lat,
          lng: stay.lng,
          count: days,
        });
      }
    });

    setUniqueLocations(Array.from(locMap.values()));
  }, [locations]);

  return { locations, stays, uniqueLocations };
}
