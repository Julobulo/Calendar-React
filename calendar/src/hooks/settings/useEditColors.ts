import { useEffect, useState, useCallback } from "react";
import { Colors } from "../../utils/types";
import { toast } from "react-toastify";

export function useEditColors() {
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState<Colors>({
    activities: {},
    note: "",
    variables: {},
  });

  // Save colors to backend
  const saveColors = useCallback(
    async (newColors: Colors) => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URI}/settings/colors`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(newColors),
        });
        if (!response.ok) throw new Error("Failed to save colors");
        setColors(newColors); // update local state after successful save
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Failed to save colors");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URI}/activity/info/colors`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch colors");
        const json = await res.json();
        setColors(json);
      } catch {
        toast.error("Failed to fetch colors");
      }
    };
    fetchColors();
  }, []);

  return { loading, colors, setColors, saveColors };
}
