import { useUserCount } from "../../hooks/home/useCount";
import { HeroSection } from "./HeroSection";
import { scrollToSignup } from "./ScrollButton";
import { DailyOverview } from "./DailyOverview";
import { FeaturesSection } from "./FeaturesSection";
import { ChartsSection } from "./ChartsSection";
import Login from "../login/Login";
import { useAuth } from "../../AuthProvider";

const Home = () => {
  const { userCount, activityCount, loading: userCountLoading } = useUserCount();
  const { user, userLoading } = useAuth();

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
        activityCount={activityCount}
        userCountLoading={userCountLoading}
        scrollToSignup={scrollToSignup}
      />

      <DailyOverview />

      <ChartsSection />

      <FeaturesSection />

      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm mb-4">Try it yourself — head to your calendar and start logging today.</p>

        {(!userLoading && !user) && <Login />}
      </div>
    </div >
  );
};

export default Home;
