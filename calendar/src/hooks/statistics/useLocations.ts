import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useLocations() {
  const [locations, setLocations] = useState<{ lat: number; lng: number; label: string }[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/locations`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch locations");
        const json = await res.json();
        setLocations(json.locations || []);
      } catch {
        toast.error("Failed to fetch locations");
      }
    };

    fetchLocations();
  }, []);

  return { locations };
}
