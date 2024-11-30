import { Routes, Route } from "react-router-dom";
import Calendar from "./components/Calendar";
import Statistics from "./components/Statistics";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";

const App = () => {

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto ml-64">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
