import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Departments from "./pages/Departments.jsx";
import Teams from "./pages/Teams.jsx";
import Attendance from "./pages/Attendance.jsx";
import Goals from "./pages/Goals.jsx";
import KPIs from "./pages/KPIs.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/kpis" element={<KPIs />} />

        <Route
          path="*"
          element={
            <div style={{ padding: "40px" }}>
              <h1>Page Not Found</h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;