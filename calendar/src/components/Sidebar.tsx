import { Link, useLocation } from "react-router-dom";
import { useState } from "react"; // Import useState for managing sidebar state
import { FaBars, FaChevronLeft } from "react-icons/fa"; // Import icons for toggle button

const Sidebar = () => {
  const location = useLocation(); // Get the current route
  const [isOpen, setIsOpen] = useState(false); // State to manage sidebar visibility

  // Function to determine if a route is active
  const isActive = (path: string) => location.pathname === path;

  // Toggle sidebar open/close
  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 text-white bg-blue-500 rounded-full shadow-md focus:outline-none"
      >
        {isOpen ? <FaChevronLeft /> : <FaBars />}
      </button>

      {/* Sidebar */}
      {isOpen && <aside
        className={`fixed top-0 left-0 h-full bg-gray-100 shadow-md transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
        style={{ width: isOpen ? "16rem" : "0" }} // Smooth resizing
      >
        <div className="p-4 text-center text-lg font-bold border-b border-gray-300">
          <Link to="/">Dashboard</Link>
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
      </aside>}
    </div>
  );
};

export default Sidebar;
