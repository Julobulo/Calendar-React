import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getHumanTimeFromMinutes, highlightTimesAndNames, isLightOrDark } from "../utils/helpers";
import { useState } from "react";
import { LocationPicker } from "./LocationPicker";
import { Card, CardContent } from "./Card";

const colors: {
  activities: { [activity: string]: string };
  note: string;
  variables: { [variable: string]: string };
} = {
  activities: {
    Coding: "#6366f1",
    Workout: "#22c55e",
    Reading: "#f59e0b",
    Meditation: "#06b6d4"
  },
  variables: {
    "Weight (kg)": "#f87171",
  },
  note: "#D9EAFB",
};

const mockDayActivities: {
  entries: { activity: string, description: string, duration: number }[],
  variables: { variable: string, value: string }[],
  note: string
} = {
  entries: [
    {
      activity: "Coding",
      description: "Worked for 2h5min on my website's UI with my friend @Alexis",
      duration: 125,
    },
    {
      activity: "Workout",
      description: "Push day: hit chest and triceps for 1h30min",
      duration: 90,
    },
    {
      activity: "Reading",
      description: "45min finished chapter on evolution",
      duration: 45,
    },
  ],
  variables: [
    {
      variable: "Weight (kg)",
      value: "70",
    },
  ],
  note: "Had a productive day, talked to @Alice and @Bob in the afternoon.",
};

const mockWeekStats = [
  { name: "Mon", Coding: 120, Workout: 90 },
  { name: "Tue", Coding: 100, Workout: 80 },
  { name: "Wed", Coding: 180, Workout: 60 },
  { name: "Thu", Coding: 140, Workout: 120 },
  { name: "Fri", Coding: 200, Workout: 90 },
];

const pieData = [
  { name: "Coding", value: 740, color: colors.activities.Coding },
  { name: "Workout", value: 440, color: colors.activities.Workout },
  { name: "Reading", value: 240, color: colors.activities.Reading },
];

const mockData = [
  { name: "Mon", Coding: 120, Workout: 90 },
  { name: "Tue", Coding: 100, Workout: 80 },
  { name: "Wed", Coding: 180, Workout: 60 },
  { name: "Thu", Coding: 140, Workout: 120 },
  { name: "Fri", Coding: 200, Workout: 90 },
];

const Home = () => {
  const [selectedLocation, setSelectedLocation] = useState<{ name: string, lat: number, lng: number } | null>({ name: "Home in Paris", lat: 48.8566, lng: 2.3522 });
  const isSavingLocation = false;

  const handleClick = () => { };
  return (
    <div className="flex flex-col gap-10 items-center justify-center p-10 pt-5 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Track Your Life</h1>
        <p className="text-lg text-gray-600">
          Log your days, see your progress, and build better habits.
        </p>
      </div>

      <div className="w-full">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">What a Day Looks Like</h2>
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4">
          <div className="" onClick={handleClick}>
            <LocationPicker
              date={new Date()}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              isSavingLocation={isSavingLocation}
            />
          </div>

          <div className="w-full flex flex-col space-y-2">
            {mockDayActivities.entries.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div style={{ backgroundColor: colors.activities[entry.activity] || "#ffffff" }} className="rounded-2xl shadow-md">
                  <Card className="bg-transparent">
                    <CardContent className={`p-4 text-left text-[14px] ${isLightOrDark(colors.activities[entry.activity]) ? "text-black" : "text-white"}`}>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">{entry.activity}</h3>
                        <span>-</span>
                        <p>{getHumanTimeFromMinutes(entry.duration)}</p>
                      </div>
                      <p dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(entry.description) }}></p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}

            <hr className="my-4" />

            {mockDayActivities.variables.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mockDayActivities.entries.length * 0.1 + index * 0.1 }}
              >
                <div style={{ backgroundColor: colors.variables[entry.variable] || "#ffffff" }} className="rounded-2xl shadow-md">
                  <Card className="bg-transparent">
                    <CardContent className={`p-4 text-left text-[14px] ${isLightOrDark(colors.variables[entry.variable]) ? "text-black" : "text-white"}`}>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">{entry.variable}</h3>
                        <span>-</span>
                        <p>{entry.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}

            <hr className="my-4" />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay:
                  mockDayActivities.entries.length * 0.1 +
                  mockDayActivities.variables.length * 0.1,
              }}
            >
              <div style={{ backgroundColor: colors.note }} className="rounded-2xl shadow-md">
                <Card className="bg-transparent">
                  <CardContent className={`${isLightOrDark(colors.note) ? "text-black" : "text-white"} text-[14px] p-4`}>
                    <span dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(mockDayActivities.note) }}></span>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Your Week at a Glance</h2>
        <div className="w-full h-64 bg-white rounded-2xl shadow-md p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Coding" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Workout" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center md:text-left">Your Week at a Glance</h2>
          <div className="h-64 bg-white rounded-2xl shadow-md p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeekStats}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Coding" fill={colors.activities.Coding} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Workout" fill={colors.activities.Workout} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center md:text-left">Time Distribution</h2>
          <div className="h-64 bg-white rounded-2xl shadow-md p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name }) => name}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <h3 className="text-xl font-bold mb-2">📅 Log Each Day</h3>
          <p className="text-gray-600 text-sm">Add activities, time, and notes — it’s quick and flexible.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <h3 className="text-xl font-bold mb-2">📊 View Your Progress</h3>
          <p className="text-gray-600 text-sm">Visualize your habits over time with clean charts.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <h3 className="text-xl font-bold mb-2">🧠 Stay Accountable</h3>
          <p className="text-gray-600 text-sm">Seeing your data helps you stay consistent.</p>
        </div>
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm mb-4">Try it yourself — head to your calendar and start logging today.</p>
        <a
          href="/calendar"
          className="inline-block px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
        >
          → Go to Calendar
        </a>
      </div>
    </div>
  );
};

export default Home;
