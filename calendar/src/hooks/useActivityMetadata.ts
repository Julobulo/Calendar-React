// src/hooks/useActivityMetadata.ts
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Colors } from "../utils/types";
import { useAuth } from "../AuthProvider";

export function useActivityMetadata(reload: boolean) {
  const { user, userLoading } = useAuth();
  const [colors, setColors] = useState<Colors>({ activities: {}, note: "", variables: {} });
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchColors = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/colors`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        toast.error(`Failed to fetch colors: ${(await response.json()).message}`);
        return;
      }
      const data = await response.json();
      setColors(data);
    };

    if (!userLoading && user) fetchColors();
  }, [reload]);

  useEffect(() => {
    const fetchNames = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/names`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        toast.error(`Failed to fetch names: ${(await response.json()).message}`);
        return;
      }
      const data = await response.json();
      setNames(data);
    };

    if (!userLoading && user) fetchNames();
  }, [reload]);

  return { colors, names };
}
