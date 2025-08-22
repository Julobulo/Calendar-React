// src/hooks/useActivityMetadata.ts
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

interface Colors {
  activities: { [activity: string]: string };
  note: string;
  variables: { [variable: string]: string };
}

export function useActivityMetadata(reload: boolean) {
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

    if (Cookies.get("token")) fetchColors();
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

    if (Cookies.get("token")) fetchNames();
  }, [reload]);

  return { colors, names };
}
