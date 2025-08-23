import { useUserCount } from "../../hooks/home/useCount";
import { HeroSection } from "./HeroSection";
import { ProductiveTimeChart } from "./charts/ProductiveTimeChart";
import { scrollToSignup } from "./ScrollButton";
import { DailyOverview } from "./DailyOverview";
import { GoalsCard } from "./charts/GoalsCard";
import { StudyingVSYoutube } from "./charts/StudyingVSYoutube";
import { FeaturesSection } from "./FeaturesSection";
import { TimeBreakdownByDay } from "./charts/TimeBreakdownByDay";
import { Streaks } from "./charts/Streaks";
import { TimeSpentPerActivity } from "./charts/TimeSpentPerActivity";
import { AverageTimesPerWeek } from "./charts/AverageTimesPerWeek";
import { ProgressOverTime } from "./charts/ProgressOverTime";

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

          <TimeBreakdownByDay />

          <Streaks />
          
          <TimeSpentPerActivity />

          <AverageTimesPerWeek />

          <ProgressOverTime />

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
