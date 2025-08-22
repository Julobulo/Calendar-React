// src/hooks/useEventForm.ts
import { useState } from "react";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { ObjectId } from "bson";

type EventState = "add" | "edit";
type FormType = "activity" | "note" | "variable";

interface EventPopUp {
  state: EventState;
  _id: ObjectId;
  activity: string;
  description: string;
  start: string;
  end: string;
  note: string;
  variable: string;
  value: string;
}

export function useEventForm(year: number, month: number, day: number, reload: boolean, setReload: React.Dispatch<React.SetStateAction<boolean>>) {
  const [eventPopUp, setEventPopUp] = useState<EventPopUp>({
    state: "add",
    _id: new ObjectId,
    activity: "",
    description: "",
    start: "",
    end: "",
    note: "",
    variable: "",
    value: ""
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormType>("activity");

  const handleEventFinish = async () => {
    if (!Cookies.get("token")) return;

    setActionLoading(true);

    let body: any;
    if (selectedForm === "activity") {
      if (!eventPopUp.activity || !eventPopUp.description) {
        toast.error("Please fill in both activity and description");
        setActionLoading(false);
        return;
      }
      body = { year, month, day, type: "activity", ...eventPopUp };
    } else if (selectedForm === "note") {
      if (!eventPopUp.note) {
        toast.error("Please fill in the note");
        setActionLoading(false);
        return;
      }
      body = { year, month, day, type: "note", note: eventPopUp.note };
    } else if (selectedForm === "variable") {
      if (!eventPopUp.variable || !eventPopUp.value) {
        toast.error("Please fill in both variable and value");
        setActionLoading(false);
        return;
      }
      body = { year, month, day, type: "variable", variable: eventPopUp.variable, value: eventPopUp.value };
    }

    const url = eventPopUp.state === "add" ? "/activity/new" : "/activity/edit";
    const method = eventPopUp.state === "add" ? "POST" : "PATCH";

    const response = await fetch(`${import.meta.env.VITE_API_URI}${url}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.message);
    } else {
      setEventPopUp({ state: "add", _id: new ObjectId, activity: "", description: "", start: "", end: "", note: "", variable: "", value: "" });
      setReload(!reload);
    }

    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!Cookies.get("token")) return;

    setActionLoading(true);
    let body: any = { year, month, day, type: selectedForm };
    if (selectedForm === "activity") body.activity = eventPopUp.activity;
    if (selectedForm === "variable") body.variable = eventPopUp.variable;

    const response = await fetch(`${import.meta.env.VITE_API_URI}/activity/delete`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) toast.error(data.message);
    else {
      setEventPopUp({ state: "add", _id: new ObjectId, activity: "", description: "", start: "", end: "", note: "", variable: "", value: "" });
      setReload(!reload);
    }

    setActionLoading(false);
  };

  return { eventPopUp, setEventPopUp, selectedForm, setSelectedForm, actionLoading, handleEventFinish, handleDelete };
}
