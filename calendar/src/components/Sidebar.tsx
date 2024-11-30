import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-md p-4">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Dashboard</h2>
      <div className="flex flex-col space-y-4">
        <NavLink
          to="/calendar"
          className="text-lg p-2 rounded hover:bg-gray-200"
          activeClassName="bg-gray-300"
        >
          Calendar
        </NavLink>
        <NavLink
          to="/statistics"
          className="text-lg p-2 rounded hover:bg-gray-200"
          activeClassName="bg-gray-300"
        >
          Statistics
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
