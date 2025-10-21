import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaCalendar, FaChevronLeft } from "react-icons/fa";
// import { IoStatsChartSharp } from "react-icons/io5";
import { GoHomeFill } from "react-icons/go";
// import { IoMdSettings } from "react-icons/io";

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem("sidebarOpen") === "false" ? false : true;
  });

  const isActive = (path: string) => location.pathname === path;
  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarOpen", newState.toString());
      return newState;
    });
  };

  return (
    <>
    <div className="hidden md:flex flex-col h-full bg-gray-100 shadow-md transition-all duration-300">
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
          className={`p-3 rounded-lg ${isActive("/calendar") || isActive("/calendar/day") ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-700"
            }`}
        >
          <div className="flex items-center space-x-2">
            <FaCalendar className="text-xl" />
            {isOpen && <span>Calendar</span>}
          </div>
        </Link>
        {/* <Link
          to="/statistics"
          className={`p-3 rounded-lg ${isActive("/statistics") ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-700"
            }`}
        >
          <div className="flex items-center space-x-2">
            <IoStatsChartSharp />
            {isOpen && <span>Statistics</span>}
          </div>
        </Link>
        <Link
          to="/settings"
          className={`p-3 rounded-lg ${isActive("/settings") ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-700"
            }`}
        >
          <div className="flex items-center space-x-2">
            <IoMdSettings />
            {isOpen && <span>Settings</span>}
          </div>
        </Link> */}
      </nav>
    </div>
    {/* Mobile Navbar (Hidden on desktop) */}
    <div className="flex md:hidden bg-gray-100 shadow-md fixed bottom-0 w-full p-3 justify-around">
    <Link to="/" className={isActive("/") ? "text-blue-500" : "text-gray-700"}>
      <GoHomeFill className="text-2xl" />
    </Link>
    <Link to="/calendar" className={isActive("/calendar") ? "text-blue-500" : "text-gray-700"}>
      <FaCalendar className="text-2xl" />
    </Link>
    {/* <Link to="/statistics" className={isActive("/statistics") ? "text-blue-500" : "text-gray-700"}>
      <IoStatsChartSharp className="text-2xl" />
    </Link>
    <Link to="/settings" className={isActive("/settings") ? "text-blue-500" : "text-gray-700"}>
      <IoMdSettings className="text-2xl" />
    </Link> */}
  </div>
  </>
  );
  // return (
  //   <div className={`bg-gray-100 shadow-md transition-all duration-300 flex flex-col md:flex-row
  //     ${isOpen ? "w-full md:w-64 h-64 md:h-full" : "w-full md:w-16 h-16 md:h-full"}`}>

  //     {/* Toggle button */}
  //     <div className="p-3 flex md:hidden">
  //       <button onClick={toggleSidebar} className="p-3 text-white bg-blue-500 rounded-md w-10">
  //         {isOpen ? <FaChevronLeft /> : <FaBars />}
  //       </button>
  //     </div>

  //     {/* Sidebar Content */}
  //     <div className="p-4 text-lg font-bold border-b md:border-b-0 md:border-r border-gray-300 w-full md:w-auto">
  //       <Link to="/" className="block w-full text-center">
  //         <div className={`flex items-center space-x-2 ${!isOpen ? "justify-center" : ""}`}>
  //           <GoHomeFill className="text-xl" />
  //           {isOpen && <span>Dashboard</span>}
  //         </div>
  //       </Link>
  //     </div>

  //     {/* Navigation */}
  //     <nav className={`flex ${isOpen ? "flex-col md:flex-col" : "flex-row md:flex-col"} p-4 space-y-4 md:space-y-4 space-x-4 md:space-x-0`}>
  //       <Link
  //         to="/calendar"
  //         className={`p-3 rounded-lg ${isActive("/calendar") ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-700"}`}
  //       >
  //         <div className="flex items-center space-x-2">
  //           <FaCalendar className="text-xl" />
  //           {isOpen && <span>Calendar</span>}
  //         </div>
  //       </Link>
  //       <Link
  //         to="/statistics"
  //         className={`p-3 rounded-lg ${isActive("/statistics") ? "bg-blue-500 text-white" : "hover:bg-blue-100 text-gray-700"}`}
  //       >
  //         <div className="flex items-center space-x-2">
  //           <IoStatsChartSharp />
  //           {isOpen && <span>Statistics</span>}
  //         </div>
  //       </Link>
  //     </nav>
  //   </div>
  // );
};

export default Sidebar;
