import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthProvider";

interface HeroProps {
  userCount: number | null;
  activityCount: number | null;
  loggedInCount: number | null;
  userCountLoading: boolean;
  scrollToSignup: () => void;
}

export const HeroSection = ({
  userCount,
  activityCount,
  loggedInCount,
  userCountLoading,
  scrollToSignup,
}: HeroProps) => {
  const navigate = useNavigate();
  const { user, userLoading } = useAuth();

  return (
    <section className="text-center space-y-8 relative">
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
        Track Yourself to Make Every Hour Count
      </h1>

      {/* Subtitle */}
      <p className="text-lg text-gray-700 max-w-2xl mx-auto">
        Stay focused, track your progress, and finally <span className="text-blue-600">see where your time goes</span>.  
        Join a growing community of students and professionals who are taking control of their days.
      </p>

      {/* Stats */}
      {!userCountLoading && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-gray-600 text-base mt-4">
          {userCount !== null && (
            <div className="bg-gray-100 px-4 py-2 rounded-xl shadow-sm">
              👥 <span className="font-semibold">{userCount.toLocaleString()}</span> users joined
            </div>
          )}
          {loggedInCount !== null && (
            <div className="bg-green-100 px-4 py-2 rounded-xl shadow-sm">
              🟢 <span className="font-semibold">{loggedInCount.toLocaleString()}</span> active now
            </div>
          )}
          {activityCount !== null && (
            <div className="bg-blue-100 px-4 py-2 rounded-xl shadow-sm">
              🗓️ <span className="font-semibold">{activityCount.toLocaleString()}</span> activities logged
            </div>
          )}
        </div>
      )}

      {/* Call to action */}
      <button
        className="inline-block px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg transition-transform transform hover:scale-105"
        onClick={() => {
          if (!userLoading && user) navigate("/calendar/day");
          else scrollToSignup();
        }}
      >
        🚀 Start Organizing Your Day
      </button>

      {/* Motivation footer line */}
      <p className="text-sm text-gray-500 mt-4">
        Join {userCount?.toLocaleString() ?? "thousands of"} others getting clarity and balance today.
      </p>
    </section>
  );
};
