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
import { getDiffBetweenTimes, getHumanTimeFromMinutes, highlightTimesAndNames, isLightOrDark } from "../../utils/helpers";
import { useState } from "react";
import { LocationPicker } from "../utils/LocationPicker";
import { Card, CardContent } from "../utils/Card";
import { TbTarget } from "react-icons/tb";
import { useUserCount } from "../../hooks/home/useCount";
import { HeroSection } from "./HeroSection";
import { ProductiveTimeChart } from "./charts/ProductiveTimeChart";
import { HomeColors } from "./constants/HomeColors";
import { allActivityNames, chartData, compareActivities, highestAvgPerWeek, mockActivities, sortedActivitySummary, streaks, totalActivityTime } from "./constants/mockData";
import { scrollToSignup } from "./ScrollButton";
import { ActivityCard } from "./ActivityCard";

const Home = () => {
  const { userCount, loading: userCountLoading } = useUserCount();
  const [selectedLocation, setSelectedLocation] = useState<{ name: string, lat: number, lng: number } | null>({ name: "New York", lat: 40.712776, lng: -74.005974 });
  const isSavingLocation = false;

  const handleClick = () => { };
  return (
    <div className="flex flex-col gap-10 items-center justify-center p-10 pt-5 max-w-4xl mx-auto">
      <style>
        {`
    @keyframes pop {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }

    .pop-on-scroll {
      animation: pop 0.8s ease;
    }
  `}
      </style>
      {/* Hero Section */}
      <HeroSection
        userCount={userCount}
        userCountLoading={userCountLoading}
        scrollToSignup={scrollToSignup}
      />
      {/* <section className="text-center space-y-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r  opacity-30 pointer-events-none rounded-xl" />

        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
          Struggling to Know Where Your Time Goes?
        </h1>

        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          You finish your day tired, yet wonder: <span className="italic">“What did I actually get done?”</span>
          <br />You're not alone—millions of people face the same problem of lost hours, scattered focus, and no clear progress.
        </p>

        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
          That’s Why We Built This Calendar.
        </h2>

        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Our platform helps you
          {userCountLoading === false && userCount && (
            <> and <span className="font-semibold">{userCount.toLocaleString()}</span> others</>
          )}{" "}
          track your daily activities—so you can finally see <span className="font-semibold">where your time really goes</span>.
        </p>

        <ul className="text-left max-w-2xl mx-auto text-gray-700 space-y-3">
          <li>✅ Log your activities in seconds, without breaking focus</li>
          <li>✅ Spot hidden time-wasters you didn’t even notice</li>
          <li>✅ Visualize patterns that reveal your true priorities</li>
          <li>✅ Build better habits and measure real progress</li>
        </ul>

        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Whether you want to <span className="font-semibold">boost productivity</span>,
          <span className="font-semibold"> balance work and hobbies</span>, or just
          <span className="font-semibold"> stop feeling like your days slip away</span>—this tool is built to help you.
        </p>

        <button
          className="inline-block px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg transition"
          onClick={() => {
            if (Cookies.get("token")) {
              navigate("/calendar/day");
            } else scrollToSignup();
          }}
        >
          🚀 Start Taking Back Your Time
        </button>
      </section> */}


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
              <ActivityCard
                entry={entry}
                index={index}
              />
            ))}

            <hr className="my-4" />

            {mockActivities[0].variables.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mockActivities[0].entries.length * 0.1 + index * 0.1 }}
              >
                <div style={{ backgroundColor: HomeColors.variables[entry.variable] || "#ffffff" }} className="rounded-2xl shadow-md">
                  <Card className="bg-transparent">
                    <CardContent className={`p-4 text-left text-[14px] ${isLightOrDark(HomeColors.variables[entry.variable]) ? "text-black" : "text-white"}`}>
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
              <div style={{ backgroundColor: HomeColors.note }} className="rounded-2xl shadow-md">
                <Card className="bg-transparent">
                  <CardContent className={`${isLightOrDark(HomeColors.note) ? "text-black" : "text-white"} text-[14px] p-4`}>
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
          <ProductiveTimeChart />

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
                          activity.entries.reduce((sum, entry) => sum + getDiffBetweenTimes(entry.start || "00:00", entry.end || "00:00"), 0)
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
                      fill={HomeColors.activities[name]}
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
                        fill={HomeColors.activities[entry.name] || "#ccc"}
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
                        fill={HomeColors.activities[entry.activity] || "#4f46e5"}
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
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke={HomeColors.variables["Weight (kg)"]}  // Use your color variable here
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </section >


      {/* Features */}
      < section className="space-y-6" >
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-4 text-center hover:scale-[1.03] transition-transform">
            <CardContent>
              <div className="text-3xl">📅</div>
              <h3 className="font-semibold mt-2">Log Each Day</h3>
              <p className="text-sm mt-1">Add activities, time, and notes — it's quick and flexible</p>
            </CardContent>
          </Card>
          <Card className="p-4 text-center hover:scale-[1.03] transition-transform">
            <CardContent>
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold mt-2">View Your Progress</h3>
              <p className="text-sm mt-1">Visualize your habits over time with clean charts</p>
            </CardContent>
          </Card>
          <Card className="p-4 text-center hover:scale-[1.03] transition-transform">
            <CardContent>
              <div className="text-3xl">🧠</div>
              <h3 className="font-semibold mt-2">Stay Accountable</h3>
              <p className="text-sm mt-1">Seeing your data helps you stay consistent</p>
            </CardContent>
          </Card>
        </div>
      </section >

      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm mb-4">Try it yourself — head to your calendar and start logging today.</p>
        <a
          id="signup"
          href="https://api.calendar.jules.tools/oauth/google"
          className="inline-block px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
        >
          → Sign up
        </a>
      </div>
    </div >
  );
};

export default Home;
