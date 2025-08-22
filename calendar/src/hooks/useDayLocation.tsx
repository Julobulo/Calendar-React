import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

interface Location {
  name: string;
  lat: number;
  lng: number;
}

export function useDayLocation(year: number, month: number, day: number) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const isInitialLocationLoad = useRef(true);

  // Fetch the location on mount or when date changes
  useEffect(() => {
    const fetchLocation = async () => {
      setIsSavingLocation(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/location/dayLocation/get`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, month, day }),
        });

        if (!res.ok) {
          const { message } = await res.json();
          toast.error(`Error fetching location: ${message}`);
          setSelectedLocation(null);
          return;
        }

        const data = await res.json();
        if (data.location) isInitialLocationLoad.current = true; // prevent saving immediately
        setSelectedLocation(data.location);
      } catch (err) {
        toast.error("Failed to fetch location");
        setSelectedLocation(null);
      } finally {
        setIsSavingLocation(false);
      }
    };

    if (Cookies.get("token")) fetchLocation();
  }, [year, month, day]);

  // Save or delete location when it changes
  useEffect(() => {
    const setLocation = async () => {
      if (isInitialLocationLoad.current) {
        isInitialLocationLoad.current = false;
        return; // skip first run
      }

      if (!selectedLocation) {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/location/dayLocation/delete`, {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, month, day }),
        });
        if (!res.ok) {
          toast.error("Failed to delete location for this day.");
        }
        return;
      }

      setIsSavingLocation(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URI}/location/dayLocation`, {
          method: "PUT",
          credentials: "include",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            month,
            day,
            ...selectedLocation,
          }),
        });

        if (!response.ok) {
          const { message } = await response.json();
          toast.error(`Failed to set location: ${message}`);
          setSelectedLocation(null);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          toast.error("Request timed out while setting location");
        } else {
          toast.error("Something went wrong while setting location");
        }
        setSelectedLocation(null);
      } finally {
        clearTimeout(timeout);
        setIsSavingLocation(false);
      }
    };

    if (Cookies.get("token")) setLocation();
  }, [selectedLocation, year, month, day]);

  return { selectedLocation, setSelectedLocation, isSavingLocation };
}
