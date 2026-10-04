import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Teams from "./pages/Teams";
import Attendance from "./pages/Attendance";
import Goals from "./pages/Goals";
import KPIs from "./pages/KPIs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/employees"
          element={<Employees />}
        />

        <Route
          path="/departments"
          element={<Departments />}
        />

        <Route
          path="/teams"
          element={<Teams />}
        />

        <Route
          path="/attendance"
          element={<Attendance />}
        />

        <Route
          path="/goals"
          element={<Goals />}
        />

        <Route
          path="/kpis"
          element={<KPIs />}
        />

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