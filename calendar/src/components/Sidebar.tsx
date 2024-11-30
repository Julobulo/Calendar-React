import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation(); // Get the current route

  // Function to determine if a route is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gray-100 shadow-md">
      <div className="p-4 text-center text-lg font-bold border-b border-gray-300">
        Dashboard
      </div>
      <nav className="flex flex-col p-4 space-y-4">
        <Link
          to="/calendar"
          className={`p-3 rounded-lg ${
            isActive("/calendar")
              ? "bg-blue-500 text-white"
              : "hover:bg-blue-100 text-gray-700"
          }`}
        >
          Calendar
        </Link>
        <Link
          to="/statistics"
          className={`p-3 rounded-lg ${
            isActive("/statistics")
              ? "bg-blue-500 text-white"
              : "hover:bg-blue-100 text-gray-700"
          }`}
        >
          Statistics
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
