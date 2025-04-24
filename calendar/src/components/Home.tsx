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
  CartesianGrid,
} from "recharts";
import { getHumanTimeFromMinutes, highlightTimesAndNames, isLightOrDark } from "../utils/helpers";
import { useState } from "react";
import { LocationPicker } from "./LocationPicker";
import { Card, CardContent } from "./Card";
import { FaRegClock } from "react-icons/fa";
import { TbTarget } from "react-icons/tb";
import { format } from "date-fns";

const colors: {
  activities: { [activity: string]: string };
  note: string;
  variables: { [variable: string]: string };
} = {
  activities: {
    Programming: "#6366f1",
    Workout: "#f97316",     // orange-500
    Reading: "#10b981",     // emerald-500
    YouTube: "#f43f5e",     // rose-500
    Travel: "#6366f1",       // indigo-500
    Chores: "#eab308",     // yellow-500
    Meditation: "#8b5cf6",  // violet-500
    Gaming: "#3b82f6",      // blue-500
    Walking: "#22c55e",     // green-500
    Rest: "#ec4899",       // pink-500
    Studying: "#484ddb",
  },
  variables: {
    "Weight (kg)": "#f87171",
  },
  note: "#D9EAFB",
};

const mockActivities = [
  {
    // _id: new ObjectId(),
    // userId: new ObjectId("66277f2f9652e665889cb0e5"),

    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-14"),
    entries: [
      { activity: "Studying", duration: 130, description: "2h10min started my chemistry presentation for friday" },
      { activity: "YouTube", duration: 60, description: "1h Watched productivity videos" },
      { activity: "Workout", duration: 90, description: "Push day: hit chest and triceps for 1h30min" },
      { activity: "Reading", duration: 30, description: "30min Fiction before bed" },
      { activity: "Programming", duration: 125, description: "Worked for 2h5min on my website's UI with my friend @Alexis" },
    ],
    note: "Had a productive day, talked to @Alice and @Bob in the afternoon.",
    variables: [{ variable: "Weight (kg)", value: "70.9" }],
    location: { name: "Home in Paris", lat: 48.8566, lng: 2.3522 },
  },
  {
    // _id: new ObjectId(),
    // userId: new ObjectId("66277f2f9652e665889cb0e5"),

    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-15"),
    entries: [
      { activity: "Studying", duration: 120, description: "2h Focused on math exercises" },
      { activity: "YouTube", duration: 45, description: "Watched science explainers for 45min" },
      { activity: "Workout", duration: 40, description: "Cardio for 20min and abs for another 20min" },
    ],
    note: "Stayed mostly at the desk today, good study flow.",
    variables: [{ variable: "Weight (kg)", value: "70.3" }],
    location: { name: "Home in Paris", lat: 48.8566, lng: 2.3522 },
  },
  {
    // _id: new ObjectId(),
    // userId: new ObjectId("66277f2f9652e665889cb0e5"),

    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-16"),
    entries: [
      { activity: "Studying", duration: 100, description: "1h40min physics revision" },
      { activity: "Chores", duration: 30, description: "Cleaned room for 10min and laundry for 20min" },
      { activity: "Reading", duration: 40, description: "40min, finished a short novel" },
    ],
    note: "Getting ready to leave for grandma's tomorrow.",
    variables: [{ variable: "Weight (kg)", value: "70.1" }],
    location: { name: "Home in Paris", lat: 48.8566, lng: 2.3522 },
  },
  {
    // _id: new ObjectId(),
    // userId: new ObjectId("66277f2f9652e665889cb0e5"),

    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-17"),
    entries: [
      { activity: "Studying", duration: 60, description: "1h Reviewed flashcards on the train" },
      { activity: "YouTube", duration: 20, description: "20min Watched news highlights" },
      { activity: "Travel", duration: 240, description: "4h Train ride to Lyon" },
    ],
    note: "Chill travel day. Grandma cooked dinner!",
    variables: [{ variable: "Weight (kg)", value: "69.8" }],
    location: { name: "Grandma's house in Lyon", lat: 45.75, lng: 4.85 },
  },
  {
    // _id: new ObjectId(),
    // userId: new ObjectId("66277f2f9652e665889cb0e5"),

    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-18"),
    entries: [
      { activity: "Studying", duration: 80, description: "1h20min Worked on chemistry problems" },
      { activity: "Reading", duration: 50, description: "50min Reading in the garden" },
      { activity: "Chores", duration: 60, description: "1h helped grandma with cleaning her house" },
    ],
    note: "Lyon is peaceful. Studied outside in the sun.",
    variables: [{ variable: "Weight (kg)", value: "69.6" }],
    location: { name: "Grandma's house in Lyon", lat: 45.75, lng: 4.85 },
  },
  {
    // _id: new ObjectId(),
    // userId: new ObjectId("66277f2f9652e665889cb0e5"),

    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-19"),
    entries: [
      { activity: "YouTube", duration: 40, description: "Watched judo tutorials for 40min" },
      { activity: "Workout", duration: 50, description: "Bodyweight full-body workout, 50min" },
      { activity: "Reading", duration: 20, description: "Started a new book (20min)" },
    ],
    note: "Keeping up with the routine even away from home.",
    variables: [{ variable: "Weight (kg)", value: "69.3" }],
    location: { name: "Grandma's house in Lyon", lat: 45.75, lng: 4.85 },
  },
  {
    // _id: new ObjectId(),
    // userId: new ObjectId("66277f2f9652e665889cb0e5"),

    _id: "mockid1",
    userId: "mockuserid",
    date: new Date("2025-04-20"),
    entries: [
      { activity: "YouTube", duration: 90, description: "Watched documentaries, 1h30min" },
      { activity: "Studying", duration: 60, description: "1h light review of math" },
      { activity: "Rest", duration: 0, description: "Relaxed all day" },
    ],
    note: "Took a break but still did a bit of study.",
    variables: [{ variable: "Weight (kg)", value: "69" }],
    location: { name: "Grandma's house in Lyon", lat: 45.75, lng: 4.85 },
  },
];

const streaks = [
  { activity: "Workout", current: 2, longest: 10 },
  { activity: "Study", current: 5, longest: 18 },
  { activity: "Reading", current: 1, longest: 7 }
];

const compareActivities = mockActivities.map(activity => {
  const date = format(new Date(activity.date), "EEE"); // e.g., "Mon"
  let studyTime = 0;
  let youtubeTime = 0;

  activity.entries.forEach(entry => {
    if (entry.activity.toLowerCase().includes("study")) {
      studyTime += entry.duration;
    } else if (entry.activity.toLowerCase().includes("youtube")) {
      youtubeTime += entry.duration;
    }
  });

  return {
    date,
    Study: +(studyTime / 60).toFixed(1), // Convert to hours
    YouTube: +(youtubeTime / 60).toFixed(1),
  };
});

// Sum durations per activity from mockActivities
const activityDurationMap = mockActivities.reduce((acc, { entries }) => {
  for (const { activity, duration } of entries) {
    acc[activity] = (acc[activity] || 0) + duration;
  }
  return acc;
}, {} as Record<string, number>);

const sortedActivitySummary = Object.entries(activityDurationMap)
  .filter(([_, time]) => time > 0)
  .map(([name, time]) => ({ name, time }))
  .sort((a, b) => b.time - a.time);

const totalActivityTime = sortedActivitySummary.reduce((sum, { time }) => sum + time, 0);

const highestAvgPerWeek = [
  { activity: "Studying", avg: 630 },
  { activity: "Workout", avg: 210 },
  { activity: "YouTube", avg: 270 },
  { activity: "Reading", avg: 180 },
  { activity: "Chores", avg: 150 },
  { activity: "Travel", avg: 120 },
  { activity: "Rest", avg: 90 },
];

const allActivityNames = Array.from(
  new Set(mockActivities.flatMap((a) => a.entries.map((e) => e.activity)))
);

// Convert mockActivities into chart-friendly format
const chartData = mockActivities.map((activity) => {
  const day = activity.date.toLocaleDateString("en-US", { weekday: "short" });
  const dayData: any = { day };

  for (const entry of activity.entries) {
    if (entry.duration > 0) {
      dayData[entry.activity] = entry.duration;
    }
  }

  return dayData;
});

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
            {mockActivities[0].entries.map((entry, index) => (
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

            {mockActivities[0].variables.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mockActivities[0].entries.length * 0.1 + index * 0.1 }}
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
                  mockActivities[0].entries.length * 0.1 +
                  mockActivities[0].variables.length * 0.1,
              }}
            >
              <div style={{ backgroundColor: colors.note }} className="rounded-2xl shadow-md">
                <Card className="bg-transparent">
                  <CardContent className={`${isLightOrDark(colors.note) ? "text-black" : "text-white"} text-[14px] p-4`}>
                    <span dangerouslySetInnerHTML={{ __html: highlightTimesAndNames(mockActivities[0].note) }}></span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent>
              <div className="flex items-center mb-3">
                <FaRegClock className="text-3xl mr-2" />
                <h3 className="text-xl font-bold">Unproductive vs Productive Time Spent This Week</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { day: "Mon", Productive: 3, Unproductive: 2 },
                  { day: "Tue", Productive: 4, Unproductive: 1.5 },
                  { day: "Wed", Productive: 5, Unproductive: 2 },
                  { day: "Thu", Productive: 2.5, Unproductive: 3 },
                  { day: "Fri", Productive: 3, Unproductive: 2.5 },
                  { day: "Sat", Productive: 1.5, Unproductive: 4 },
                  { day: "Sun", Productive: 2, Unproductive: 3.5 }
                ]}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `${v}h`} />
                  <Legend />
                  <Bar dataKey="Productive" stackId="a" fill="#10b981" />
                  <Bar dataKey="Unproductive" stackId="a" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center mb-3">
                <TbTarget className="text-xl mr-2" color="#FF5722" />
                <h3 className="text-xl font-bold">Goals For This Week</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Study", actual: 9, target: 10, color: "bg-indigo-500" },
                  { name: "Gym", actual: 3, target: 3, color: "bg-green-500" },
                  { name: "Reading", actual: 2, target: 5, color: "bg-yellow-500" }
                ].map((goal, i) => {
                  const percent = Math.min(100, (goal.actual / goal.target) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{goal.name}</span>
                        <span>{goal.actual}h / {goal.target}h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${goal.color}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
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
              <h2 className="text-xl font-bold">🧱 Time Breakdown by Day</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="day" />
                  {/* <YAxis /> */}
                  <YAxis
                    ticks={(() => {
                      const maxDailyMinutes = Math.max(
                        ...mockActivities.map((activity) =>
                          activity.entries.reduce((sum, entry) => sum + entry.duration, 0)
                        )
                      );

                      const maxHours = Math.ceil(maxDailyMinutes / 60);
                      return Array.from({ length: maxHours + 1 }, (_, i) => i * 60);
                    })()}
                    tickFormatter={(value: number) => `${(value / 60).toFixed(0)}h`}
                  />
                  <Tooltip formatter={(duration: number, activity: string) => [getHumanTimeFromMinutes(duration), activity]} />
                  <Legend />
                  {allActivityNames.map((name) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      stackId="a"
                      fill={colors.activities[name]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-xl font-bold mb-4">🔥 Your Streaks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {streaks.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-background border border-border p-3 shadow-sm flex flex-col justify-between"
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-1">{s.activity}</p>
                    <p className="text-lg font-semibold">{s.current} day{(s.current !== 1) && "s"}</p>
                    <p className="text-xs text-muted-foreground">Longest: {s.longest} day{(s.longest !== 1) && "s"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-xl font-bold">📊 Time Spent Per Activity This Week</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sortedActivitySummary}
                    dataKey="time"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name }) => name}
                  >
                    {sortedActivitySummary.map((entry, index) => (
                      <Cell
                        key={`cell-${index}-${entry.name}`}
                        fill={colors.activities[entry.name] || "#ccc"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props) => {
                      const rank =
                        sortedActivitySummary.findIndex((e) => e.name === props.payload.name) + 1;
                      const percentage = ((value / totalActivityTime) * 100).toFixed(1);
                      return [
                        <>
                          <div className="flex justify-between gap-2 font-medium">
                            <span>{name} — #{rank}</span>
                          </div>
                          <div>{getHumanTimeFromMinutes(value)} ({percentage}%)</div>
                        </>,
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-xl font-bold mb-4">🏆 Average Times Per Week</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={highestAvgPerWeek}
                  margin={{ left: 18 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="activity" />
                  <YAxis tickFormatter={(value) => getHumanTimeFromMinutes(value)} />
                  <Tooltip
                    formatter={(value: number) => getHumanTimeFromMinutes(value)}
                  />
                  <Bar
                    dataKey="avg"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  >
                    {highestAvgPerWeek.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors.activities[entry.activity] || "#4f46e5"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-xl font-bold mb-4">
                📈 <span className="font-semibold">Weight</span> Progress Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={mockActivities
                    .filter((entry) =>
                      entry.variables.some((v) => v.variable === "Weight (kg)")
                    )
                    .map((entry) => ({
                      date: entry.date.toISOString().split("T")[0],
                      weight: parseFloat(
                        entry.variables.find((v) => v.variable === "Weight (kg)")?.value!
                      ),
                    }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis unit="kg" />
                  <Tooltip formatter={(value) => `${value} kg`} />
                  <Line type="monotone" dataKey="weight" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </section >


      {/* Features */}
      < section className="space-y-6" >
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
      </section >

      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm mb-4">Try it yourself — head to your calendar and start logging today.</p>
        <a
          href="/calendar"
          className="inline-block px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
        >
          → Go to Calendar
        </a>
      </div>
    </div >
  );
};

export default Home;
