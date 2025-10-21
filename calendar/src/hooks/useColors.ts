import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Colors } from "../utils/types";

export function useColors() {
  const [colors, setColors] = useState<Colors>({ activities: {}, note: "", variables: {} });

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/activity/info/colors`, {
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
