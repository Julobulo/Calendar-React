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
import { getDiffBetweenTimes, getHumanTimeFromMinutes } from "../../utils/helpers";
import { Card, CardContent } from "../utils/Card";
import { useUserCount } from "../../hooks/home/useCount";
import { HeroSection } from "./HeroSection";
import { ProductiveTimeChart } from "./charts/ProductiveTimeChart";
import { HomeColors } from "./constants/HomeColors";
import { allActivityNames, chartData, highestAvgPerWeek, mockActivities, sortedActivitySummary, streaks, totalActivityTime } from "./constants/mockData";
import { scrollToSignup } from "./ScrollButton";
import { DailyOverview } from "./DailyOverview";
import { GoalsCard } from "./charts/GoalsCard";
import { StudyingVSYoutube } from "./charts/StudyingVSYoutube";
import { FeaturesSection } from "./FeaturesSection";

const Home = () => {
  const { userCount, loading: userCountLoading } = useUserCount();

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
      <HeroSection
        userCount={userCount}
        userCountLoading={userCountLoading}
        scrollToSignup={scrollToSignup}
      />

      <DailyOverview />

      {/* Gain Insight Into Your Habits */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gain Insight Into Your Habits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProductiveTimeChart />

          <GoalsCard />

          <StudyingVSYoutube />

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

      <FeaturesSection />

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
