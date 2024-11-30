import { Routes, Route } from "react-router-dom";
import Calendar from "./components/Calendar";

const App = () => {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Calendar />} />
      </Routes>
    </main>
  )
}

export default App
