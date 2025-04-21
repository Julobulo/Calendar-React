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
  Legend,
  LineChart,
  Line,
} from "recharts";
import { getHumanTimeFromMinutes, highlightTimesAndNames, isLightOrDark } from "../utils/helpers";
import { useState } from "react";
import { LocationPicker } from "./LocationPicker";
import { Card, CardContent } from "./Card";
import { FaCalendarAlt, FaFlagCheckered, FaHourglassHalf, FaRunning } from "react-icons/fa";

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

const streaks = [18, 11, 9];

const compareActivities = [
  { date: "Mon", Study: 2, YouTube: 3 },
  { date: "Tue", Study: 3, YouTube: 2 },
  { date: "Wed", Study: 4, YouTube: 1 },
  { date: "Thu", Study: 2.5, YouTube: 2.5 },
  { date: "Fri", Study: 3, YouTube: 3 },
  { date: "Sat", Study: 1.5, YouTube: 4 },
  { date: "Sun", Study: 2, YouTube: 3.5 }
];

const activitySummary = [
  { name: "Study", time: 16 },
  { name: "YouTube", time: 19 },
  { name: "Gym", time: 6 },
  { name: "Reading", time: 9 }
];

const highestAvgPerWeek = [
  { activity: "Study", avg: 9 },
  { activity: "Reading", avg: 6.5 }
];

const milestones = [
  { label: "Started tracking", icon: <FaFlagCheckered className="text-blue-500" /> },
  { label: "Logged 50 hours", icon: <FaHourglassHalf className="text-purple-500" /> },
  { label: "Longest streak hit", icon: <FaRunning className="text-pink-500" /> },
  { label: "1000th entry!", icon: <FaCalendarAlt className="text-green-500" /> }
];

const totalTime = activitySummary.reduce((sum, a) => sum + a.time, 0);

const stackedActivityByDay = [
  { day: "Mon", Study: 2, YouTube: 3, Reading: 1 },
  { day: "Tue", Study: 3, YouTube: 2, Reading: 0.5 },
  { day: "Wed", Study: 4, YouTube: 1, Reading: 1 },
  { day: "Thu", Study: 2.5, YouTube: 2.5, Reading: 1 },
  { day: "Fri", Study: 3, YouTube: 3, Reading: 1 },
  { day: "Sat", Study: 1.5, YouTube: 4, Reading: 1 },
  { day: "Sun", Study: 2, YouTube: 3.5, Reading: 1 }
];

const Home = () => {
  const [selectedLocation, setSelectedLocation] = useState<{ name: string, lat: number, lng: number } | null>({ name: "Home in Paris", lat: 48.8566, lng: 2.3522 });
  const isSavingLocation = false;

  const handleClick = () => { };
  return (
    <div className="flex flex-col gap-10 items-center justify-center p-10 pt-5 max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-20 pointer-events-none rounded-xl" />
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
          Take Control of Your Time
        </h1>
        <p className="text-lg text-gray-600">
          Log your days, see your progress, and build better habits.
        </p>
        <a href="/calendar" className="mt-4 text-lg px-6 py-3 rounded-2xl">
          Try the Calendar
        </a>
      </section>

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

      {/* Gain Insight Into Your Habits */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gain Insight Into Your Habits</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-4">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Weekly Summary</h3>
              <p>You were most consistent on Tuesday and Thursday.</p>
              <p>Total hours logged this week: <strong>18h 30min</strong></p>
              <p>🔥 3-day streak!</p>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Time Distribution</h3>
              <p>Most time spent on: <strong>Coding</strong></p>
              <p>Least time spent on: <strong>Exercise</strong></p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold">🔥 Longest Streak</h2>
            <p className="text-2xl mt-2">18 days in a row</p>
            <p className="mt-2 text-sm">Top Weeks: {streaks.join(", ")} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-bold">📚 Studying vs YouTube (Last 7 Days)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={compareActivities}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number, name: string) => [`${value}h`, name]} />
                <Legend />
                <Line type="monotone" dataKey="Study" stroke="#6366f1" />
                <Line type="monotone" dataKey="YouTube" stroke="#f43f5e" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-bold">📊 Time Spent Per Activity</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={activitySummary}
                  dataKey="time"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={(entry) => entry.name}
                >
                  {activitySummary.map((entry, index) => (
                    <Cell key={`cell-${index}-${entry.name}`} fill={["#6366f1", "#f43f5e", "#10b981", "#f59e0b"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${((value / totalTime) * 100).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-bold">🏆 Average Times For Each Activity per Week</h2>
            <ul className="mt-2 space-y-1">
              {highestAvgPerWeek.map((a, i) => (
                <li key={i}>{a.activity}: <span className="font-semibold">{a.avg}h/week</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-bold">🗓️ Milestones</h2>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-xl">
                  {m.icon}
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-bold">🧱 Time Breakdown by Day</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stackedActivityByDay}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value: number, name: string) => [`${value}h`, name]} />
                <Legend />
                <Bar dataKey="Study" stackId="a" fill="#6366f1" />
                <Bar dataKey="YouTube" stackId="a" fill="#f43f5e" />
                <Bar dataKey="Reading" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-4 text-center hover:scale-[1.03] transition-transform">
            <CardContent>
              <div className="text-3xl">📅</div>
              <h3 className="font-semibold mt-2">📅 Log Each Day</h3>
              <p className="text-sm mt-1">Add activities, time, and notes — it's quick and flexible</p>
            </CardContent>
          </Card>
          <Card className="p-4 text-center hover:scale-[1.03] transition-transform">
            <CardContent>
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold mt-2">📊 View Your Progress</h3>
              <p className="text-sm mt-1">Visualize your habits over time with clean charts</p>
            </CardContent>
          </Card>
          <Card className="p-4 text-center hover:scale-[1.03] transition-transform">
            <CardContent>
              <div className="text-3xl">🧠</div>
              <h3 className="font-semibold mt-2">🧠 Stay Accountable</h3>
              <p className="text-sm mt-1">Seeing your data helps you stay consistent</p>
            </CardContent>
          </Card>
        </div>
      </section>

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
