import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../AuthProvider";

export function useLifetimeActivity() {
  const { user, userLoading } = useAuth();
  const [data, setData] = useState<{ activity: string; totalTime: number }[]>([]);
  const [firstActivityDate, setFirstActivityDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLifetimeActivity = async () => {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URI}/statistics/lifetime-activity`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error(`Failed to fetch lifetime activity: ${(await res.json()).message}`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (!Array.isArray(json.activities)) {
        toast.error("Invalid data format for lifetime activity");
        setLoading(false);
        return;
      }
      setData(json.activities);
      setFirstActivityDate(json.firstActivityDate || null);
      setLoading(false);
    };

    if (!userLoading && user) fetchLifetimeActivity();
  }, []);

  return { data, firstActivityDate, loading };
}
