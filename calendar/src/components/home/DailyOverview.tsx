import { useState } from "react";
import { LocationPicker } from "../utils/LocationPicker";
import { ActivityCard } from "./ActivityCard";
import { VariableCard } from "./VariableCard";
import { NoteCard } from "./NoteCard";
import { mockActivities } from "./constants/mockData";

export const DailyOverview = () => {
  const [selectedLocation, setSelectedLocation] = useState<{ name: string, lat: number, lng: number } | null>({
    name: "New York",
    lat: 40.712776,
    lng: -74.005974
  });
  const isSavingLocation = false;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">What a Day Looks Like</h2>
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4">
        <LocationPicker
          date={new Date()}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          isSavingLocation={isSavingLocation}
          deleteLocation={async () => setSelectedLocation(null)}
        />

        <div className="w-full flex flex-col space-y-2">
          {mockActivities[0].entries.map((entry, index) => (
            <ActivityCard entry={entry} index={index} key={index} />
          ))}

          <hr className="my-4" />

          {mockActivities[0].variables.map((entry, index) => (
            <VariableCard entry={entry} delay={mockActivities[0].entries.length * 0.1 + index * 0.1} key={index} />
          ))}

          <hr className="my-4" />

          <NoteCard note={mockActivities[0].note} />
        </div>
      </div>
    </div>
  );
};
