import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaCalendar, FaChevronLeft } from "react-icons/fa";
import { IoStatsChartSharp } from "react-icons/io5";
import { GoHomeFill } from "react-icons/go";

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;
  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <div className="h-full bg-gray-100 shadow-md transition-all duration-300 flex flex-col">
      {/* Toggle button inside sidebar */}
      <div className={`w-full p-3 flex ${!isOpen && "justify-center"}`}>
        <button
          onClick={toggleSidebar}
          className="p-3 text-white bg-blue-500 rounded-md w-10"
        >
          {isOpen ? <FaChevronLeft /> : <FaBars />}
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="p-4 text-lg font-bold border-b border-gray-300">
        <Link to="/" className="block w-full text-center">
          <div className={`flex items-center space-x-2 ${!isOpen ? "justify-center" : ""}`}>
            <GoHomeFill className="text-xl" />
            {isOpen && <span>Dashboard</span>}
          </div>
        </Link>
      </div>
      <nav className="flex flex-col p-4 space-y-4">
        <Link
          to="/calendar"
          className={`p-3 rounded-lg ${isActive("/calendar") ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-700"
            }`}
        >
          <div className="flex items-center space-x-2">
            <FaCalendar className="text-xl" />
            {isOpen && <span>Calendar</span>}
          </div>
        </Link>
        <Link
          to="/statistics"
          className={`p-3 rounded-lg ${isActive("/statistics") ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-700"
            }`}
        >
          <div className="flex items-center space-x-2">
            <IoStatsChartSharp />
            {isOpen && <span>Statistics</span>}
          </div>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
