import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Colors {
  activities: { [activity: string]: string };
}

export function useColors() {
  const [colors, setColors] = useState<Colors>({ activities: {} });

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/settings/colors`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch colors");
        const json = await res.json();
        setColors(json);
      } catch (err) {
        toast.error("Failed to fetch colors");
      }
    };

    fetchColors();
  }, []);

  return { colors };
}
