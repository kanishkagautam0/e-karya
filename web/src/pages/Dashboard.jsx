
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
function Dashboard() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Invalid user data:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>e-Karya</h1>
          <p>Government Productivity & Performance Management</p>
        </div>

        <button onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <section className="welcome-section">
          <p className="eyebrow">Dashboard</p>

          <h2>
            Welcome, {user.name || "User"}
          </h2>

          <p>
            Monitor goals, KPIs, tasks and productivity from one
            centralized platform.
          </p>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Organization</span>
            <strong>—</strong>
            <small>Overall performance</small>
          </div>

          <div className="stat-card">
            <span>Teams</span>
            <strong>—</strong>
            <small>Team performance</small>
          </div>

          <div className="stat-card">
            <span>Employees</span>
            <strong>—</strong>
            <small>Individual performance</small>
          </div>

          <div className="stat-card">
            <span>Productivity</span>
            <strong>—</strong>
            <small>Current productivity score</small>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <span className="card-label">Quick Access</span>
                <h3>Manage e-Karya</h3>
              </div>
            </div>

            <div className="quick-actions">
              <button onClick={() => navigate("/employees")}>
                <span>01</span>
                Employees
              </button>

              <button onClick={() => navigate("/departments")}>
                <span>02</span>
                Departments
              </button>

              <button onClick={() => navigate("/teams")}>
                <span>03</span>
                Teams
              </button>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <span className="card-label">Account</span>
                <h3>Your Profile</h3>
              </div>
            </div>

            <div className="profile-info">
              <div>
                <span>Name</span>
                <strong>{user.name || "—"}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{user.email || "—"}</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>{user.role || "—"}</strong>
              </div>

              <div>
                <span>Department</span>
                <strong>{user.department || "—"}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;

