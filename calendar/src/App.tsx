import { Routes, Route } from "react-router-dom";
import Calendar from "./components/Calendar";
import Statistics from "./components/Statistics";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Login from "./components/Login";
import Cookies from "js-cookie";
import { Analytics } from "@vercel/analytics/react"
import Day from "./components/Day";
import { ToastContainer, Bounce } from "react-toastify";

const App = () => {

  return (
    <div className="flex h-screen">
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
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <Routes>
          <Route path="/" element={
            <div className="bg-gray-100 p-10">
              <Home />
              {!Cookies.get('token') && <Login />}
            </div>
          } />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/calendar/day" element={<Day />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
