import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthProvider";

interface HeroProps {
  userCount: number | null;
  activityCount: number | null;
  userCountLoading: boolean;
  scrollToSignup: () => void;
}

export const HeroSection = ({ userCount, activityCount, userCountLoading, scrollToSignup }: HeroProps) => {
  const navigate = useNavigate();
  const { user, userLoading } = useAuth();

  return (
    <section className="text-center space-y-8 relative">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
        Struggling to Know Where Your Time Goes?
      </h1>

      <p className="text-lg text-gray-700 max-w-2xl mx-auto">
        You finish your day tired, yet wonder:
        <span className="italic">“What did I actually get done?”</span>
      </p>

      <p className="text-lg text-gray-700 max-w-2xl mx-auto">
        Our platform helps you
        {userCountLoading === false && userCount && (
          <> and <span className="font-semibold">{userCount.toLocaleString()} others</span></>
        )} track your daily activities.
        {userCountLoading === false && activityCount &&
          <> More than <span className="font-semibold">{activityCount.toLocaleString()} activities</span> recorded!</>}
      </p>

      <button
        className="inline-block px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg transition"
        onClick={() => {
          if (!userLoading && user) navigate("/calendar/day");
          else scrollToSignup();
        }}
      >
        🚀 Start Taking Back Your Time
      </button>
    </section>
  );
};
