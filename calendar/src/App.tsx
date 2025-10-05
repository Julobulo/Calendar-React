import { Routes, Route } from "react-router-dom";
import Calendar from "./components/calendar/Calendar";
import Statistics from "./components/statistics/Statistics";
import Sidebar from "./components/Sidebar";
import Home from "./components/home/Home";
import { Analytics } from "@vercel/analytics/react"
import Day from "./components/day/Day";
import { ToastContainer, Bounce } from "react-toastify";
import Settings from "./components/settings/Settings";

const App = () => {
  return (
    <div className="flex h-screen pb-12 md:pb-0">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Bounce}
      />
      <Analytics />
      <Sidebar />
      {/* Main Content (Flex-1 ensures it takes up the remaining space) */}
      <main className="flex-1 overflow-y-auto transition-all duration-300">
        <Routes>
          <Route
            path="/"
            element={
              <div className="bg-gray-100 p-10">
                <Home />
              </div>
            }
          />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/calendar/day" element={<Day />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
