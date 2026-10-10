
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const getUser = () =>
  JSON.parse(localStorage.getItem("ekUser") || "null");

async function api(url, opts = {}) {
  const user = getUser();

  const response = await fetch(API + url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(user
        ? {
            "x-role": user.role,
            "x-user-id": String(user.id),
          }
        : {}),
      ...(opts.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Error(data.message || "Request failed");
  }

  return data;
}

function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isOverdue(task) {
  return (
    task.deadline &&
    String(task.deadline).slice(0, 10) < todayString() &&
    task.status !== "Completed"
  );
}

function Landing({ choose }) {
  return (
    <div className="landing">
      <div className="hero">
        <div className="logo">e-KARYA</div>
        <p>Government Productivity &amp; Performance Platform</p>
        <h1>Welcome</h1>
        <span className="muted">Choose your portal to continue</span>

        <div className="roles">
          <button onClick={() => choose("ADMIN")}>
            <span>👨‍💼</span>
            <b>ADMIN</b>
            <small>Main Administrator</small>
          </button>

          <button onClick={() => choose("USER")}>
            <span>👤</span>
            <b>USER</b>
            <small>Employee Portal</small>
          </button>
        </div>
      </div>
    </div>
  );
}

function Login({ role, back, done }) {
  const [email, setEmail] = useState(
    role === "ADMIN" ? "admin@ekarya.com" : ""
  );
  const [password, setPassword] = useState(
    role === "ADMIN" ? "admin123" : ""
  );
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });

      localStorage.setItem("ekUser", JSON.stringify(data.user));
      done(data.user);
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div className="login">
      <form className="loginbox" onSubmit={submit}>
        <button type="button" className="back" onClick={back}>
          ← Back
        </button>

        <div className="logo">e-KARYA</div>
        <h2>{role === "ADMIN" ? "Admin Login" : "User Login"}</h2>
        <p className="muted">
          {role === "ADMIN" ? "Main Administrator" : "Employee Portal"}
        </p>

        {error && <p className="error">{error}</p>}

        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="primary">Login</button>

        {role === "ADMIN" && (
          <small className="hint">
            Demo: admin@ekarya.com / admin123
          </small>
        )}
      </form>
    </div>
  );
}

function Shell({ user, logout, title, children }) {
  return (
    <div className="app">
      <aside>
        <div className="sideLogo">e-KARYA</div>
        <small>
          {user.role === "ADMIN" ? "GOVERNMENT ADMIN" : "EMPLOYEE PORTAL"}
        </small>

        <nav>
          <a className="selected" href="#dashboard">
            <span>▦</span> Dashboard
          </a>
          <a href="#work">
            <span>☷</span> Work Management
          </a>
          <a href="#performance">
            <span>◫</span> Performance
          </a>
          <a href="#reports">
            <span>▤</span> Reports
          </a>
        </nav>

        <div className="sideFooter">
          <div className="sideUser">
            <div className="avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <b>{user.name}</b>
              <small>{user.role}</small>
            </div>
          </div>

          <button className="logout" onClick={logout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      <main id="dashboard">
        <header>
          <div>
            <div className="eyebrow">E-KARYA / WORKSPACE</div>
            <h2>{title}</h2>
            <p className="muted">
              Government Productivity &amp; Performance Platform
            </p>
          </div>

          <div className="headerRight">
            <div className="liveBadge">
              <span /> System workspace
            </div>
            <div className="chip">
              <div className="avatar smallAvatar">
                {(user.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <b>{user.name}</b>
                <small>{user.role}</small>
              </div>
            </div>
          </div>
        </header>

        {children}

        <footer className="appFooter">
          e-KARYA · Government Productivity &amp; Performance Management
        </footer>
      </main>
    </div>
  );
}

function Card({ label, value, icon, color, note }) {
  return (
    <div className="kpiCard">
      <div className="kpiTop">
        <span className="kpiLabel">{label}</span>
        <span className={`kpiIcon ${color}`}>{icon}</span>
      </div>
      <div className="kpiValue">{value}</div>
      <div className="kpiNote">{note}</div>
    </div>
  );
}

function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="sectionHeading">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }) {
  const value = status || "Pending";
  const css =
    value === "Completed"
      ? "completed"
      : value === "In Progress"
      ? "inProgress"
      : "pending";

  return <span className={`statusBadge ${css}`}>{value}</span>;
}

function Admin({ user, logout }) {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const emptyForm = {
    employeeId: "",
    name: "",
    email: "",
    password: "",
    department: "",
    designation: "",
  };

  const [form, setForm] = useState(emptyForm);

  const [task, setTask] = useState({
    userId: "",
    title: "",
    description: "",
    priority: "Medium",
    deadline: "",
  });

  async function load() {
    setLoading(true);

    try {
      const [userData, taskData] = await Promise.all([
        api("/users"),
        api("/tasks"),
      ]);

      setUsers(userData);
      setTasks(taskData);
      setMsg("");
    } catch (error) {
      setMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const completed = tasks.filter(
    (item) => item.status === "Completed"
  ).length;

  const inProgress = tasks.filter(
    (item) => item.status === "In Progress"
  ).length;

  const pending = tasks.filter(
    (item) => item.status === "Pending"
  ).length;

  const overdue = tasks.filter(isOverdue).length;

  const completionRate = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const statusData = [
    { label: "Completed", count: completed, color: "#16845b" },
    { label: "In Progress", count: inProgress, color: "#3478d4" },
    { label: "Pending", count: pending, color: "#e5a12b" },
  ];

  const departments = users.reduce((result, employee) => {
    const name = employee.department || "General";

    if (!result[name]) {
      result[name] = { employees: 0, assigned: 0, completed: 0 };
    }

    result[name].employees++;

    const employeeTasks = tasks.filter(
      (item) =>
        String(item.userId) === String(employee.id)
    );

    result[name].assigned += employeeTasks.length;
    result[name].completed += employeeTasks.filter(
      (item) => item.status === "Completed"
    ).length;

    return result;
  }, {});

  const departmentData = Object.entries(departments)
    .map(([name, values]) => ({
      name,
      ...values,
      rate: values.assigned
        ? Math.round((values.completed / values.assigned) * 100)
        : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  const recentTasks = [...tasks]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 6);

  const filteredUsers = users.filter((employee) => {
    const text = [
      employee.name,
      employee.employeeId,
      employee.email,
      employee.department,
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  async function addUser(event) {
    event.preventDefault();

    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setForm(emptyForm);
      setMsg("Employee created successfully.");
      await load();
    } catch (error) {
      setMsg(error.message);
    }
  }

  async function assign(event) {
    event.preventDefault();

    try {
      await api("/tasks", {
        method: "POST",
        body: JSON.stringify(task),
      });

      setTask({
        userId: "",
        title: "",
        description: "",
        priority: "Medium",
        deadline: "",
      });

      setMsg("Task assigned successfully.");
      await load();
    } catch (error) {
      setMsg(error.message);
    }
  }

  async function change(id, status) {
    try {
      await api(`/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await load();
    } catch (error) {
      setMsg(error.message);
    }
  }

  return (
    <Shell user={user} logout={logout} title="Admin Dashboard">
      <div className="dashboardIntro">
        <div>
          <h1>Overview at a glance</h1>
          <p>Monitor your workforce, assigned work and delivery progress.</p>
        </div>
        <button className="refreshBtn" onClick={load}>
          ↻ Refresh data
        </button>
      </div>

      {msg && (
        <div className="notice">
          <span>{msg}</span>
          <button onClick={() => setMsg("")}>×</button>
        </div>
      )}

      <div className="cards">
        <Card
          label="Total Employees"
          value={loading ? "…" : users.length}
          icon="♙"
          color="blue"
          note="Registered employees"
        />
        <Card
          label="Total Tasks"
          value={loading ? "…" : tasks.length}
          icon="▤"
          color="purple"
          note="All assigned work"
        />
        <Card
          label="Completed Tasks"
          value={loading ? "…" : completed}
          icon="✓"
          color="green"
          note={`${completionRate}% overall completion`}
        />
        <Card
          label="Overdue Tasks"
          value={loading ? "…" : overdue}
          icon="◷"
          color="orange"
          note="Past deadline, not completed"
        />
      </div>

      <div className="analyticsGrid" id="performance">
        <section className="panel analyticsPanel">
          <SectionHeading
            title="Task Status Overview"
            subtitle="Distribution of assigned tasks"
          />

          <div className="chartSummary">
            <div>
              <span className="muted">Total work items</span>
              <strong>{tasks.length}</strong>
            </div>
            <div className="completionPill">
              {completionRate}% completed
            </div>
          </div>

          <div className="statusBars">
            {statusData.map((item) => {
              const percent = tasks.length
                ? Math.round((item.count / tasks.length) * 100)
                : 0;

              return (
                <div className="barItem" key={item.label}>
                  <div className="barMeta">
                    <span>
                      <i style={{ background: item.color }} />
                      {item.label}
                    </span>
                    <b>{item.count}</b>
                  </div>

                  <div className="barTrack">
                    <div
                      className="barFill"
                      style={{
                        width: `${percent}%`,
                        background: item.color,
                      }}
                    />
                  </div>

                  <small>{percent}% of all tasks</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel analyticsPanel">
          <SectionHeading
            title="Department Performance"
            subtitle="Completion rate by department"
          />

          {departmentData.length ? (
            <div className="departmentList">
              {departmentData.map((department) => (
                <div className="departmentItem" key={department.name}>
                  <div className="departmentMeta">
                    <div>
                      <b>{department.name}</b>
                      <small>
                        {department.employees} employees ·{" "}
                        {department.assigned} tasks
                      </small>
                    </div>
                    <strong>{department.rate}%</strong>
                  </div>

                  <div className="barTrack">
                    <div
                      className="barFill departmentFill"
                      style={{ width: `${department.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              Add employees to see department performance.
            </div>
          )}

          <div className="departmentFoot">
            <span className="legendDot" />
            Percentage of assigned tasks completed
          </div>
        </section>
      </div>

      <section className="panel recentPanel" id="work">
        <SectionHeading
          title="Recent Work"
          subtitle="Latest tasks assigned across the organization"
          action={
            <span className="recordCount">{tasks.length} total tasks</span>
          }
        />

        {recentTasks.length ? (
          <div className="tableScroll">
            <table className="workTable">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Employee</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentTasks.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <b>{item.title}</b>
                      <small className="tableSub">
                        {item.description || "No description"}
                      </small>
                    </td>
                    <td>{item.employeeName || "Employee"}</td>
                    <td>
                      <span
                        className={`priority ${
                          (item.priority || "Medium").toLowerCase()
                        }`}
                      >
                        {item.priority || "Medium"}
                      </span>
                    </td>
                    <td>
                      <span className={isOverdue(item) ? "overdueText" : ""}>
                        {item.deadline
                          ? String(item.deadline).slice(0, 10)
                          : "—"}
                      </span>
                      {isOverdue(item) && (
                        <small className="tableSub overdueText">
                          Overdue
                        </small>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            No tasks yet. Assign work to see it here.
          </div>
        )}
      </section>

      <section className="panel">
        <SectionHeading
          title="Create Employee"
          subtitle="Register a new employee account"
        />

        <form className="formgrid" onSubmit={addUser}>
          <input
            placeholder="Employee ID"
            required
            value={form.employeeId}
            onChange={(e) =>
              setForm({ ...form, employeeId: e.target.value })
            }
          />
          <input
            placeholder="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Set password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <input
            placeholder="Department"
            value={form.department}
            onChange={(e) =>
              setForm({ ...form, department: e.target.value })
            }
          />
          <input
            placeholder="Designation"
            value={form.designation}
            onChange={(e) =>
              setForm({ ...form, designation: e.target.value })
            }
          />
          <button className="primary full">＋ Create Employee</button>
        </form>
      </section>

      <section className="panel">
        <SectionHeading
          title="Assign Work"
          subtitle="Create and assign a task to an employee"
        />

        <form className="formgrid" onSubmit={assign}>
          <select
            required
            value={task.userId}
            onChange={(e) => setTask({ ...task, userId: e.target.value })}
          >
            <option value="">Select employee</option>
            {users.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.employeeId} — {employee.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Task title"
            required
            value={task.title}
            onChange={(e) => setTask({ ...task, title: e.target.value })}
          />

          <textarea
            placeholder="Work description"
            value={task.description}
            onChange={(e) =>
              setTask({ ...task, description: e.target.value })
            }
          />

          <select
            value={task.priority}
            onChange={(e) => setTask({ ...task, priority: e.target.value })}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <input
            type="date"
            min={todayString()}
            value={task.deadline}
            onChange={(e) => setTask({ ...task, deadline: e.target.value })}
          />

          <button className="primary full">＋ Assign Task</button>
        </form>
      </section>

      <section className="panel">
        <SectionHeading
          title="Employee Directory"
          subtitle="Registered workforce"
        />

        <input
          className="searchInput"
          placeholder="Search name, employee ID, email or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="tableScroll">
          <table className="workTable">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Email</th>
                <th>Designation</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((employee) => (
                <tr key={employee.id}>
                  <td><b>{employee.employeeId || "—"}</b></td>
                  <td>{employee.name}</td>
                  <td>{employee.department || "General"}</td>
                  <td>{employee.email}</td>
                  <td>{employee.designation || "Employee"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filteredUsers.length && (
          <div className="empty">No matching employees found.</div>
        )}
      </section>

      <section className="panel" id="reports">
        <SectionHeading
          title="Manage Task Status"
          subtitle="Update task progress when required"
        />

        {tasks.map((item) => (
          <div className="line taskline" key={item.id}>
            <div>
              <b>{item.title}</b>
              <small>
                {item.employeeName} · {item.priority} · Due{" "}
                {item.deadline || "—"}
              </small>
            </div>

            <select
              value={item.status}
              onChange={(e) => change(item.id, e.target.value)}
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
        ))}

        {!tasks.length && (
          <div className="empty">No work assigned yet.</div>
        )}
      </section>
    </Shell>
  );
}

function Employee({ user, logout }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setTasks(await api("/tasks"));
      setError("");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function change(id, status) {
    try {
      await api(`/tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await load();
    } catch (error) {
      setError(error.message);
    }
  }

  const completed = tasks.filter(
    (item) => item.status === "Completed"
  ).length;

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  return (
    <Shell user={user} logout={logout} title="Employee Dashboard">
      <div className="welcome">
        <div>
          <span className="welcomeEyebrow">EMPLOYEE WORKSPACE</span>
          <h1>Hello, {user.name} 👋</h1>
          <p>Track your assigned work and update your progress.</p>
        </div>
      </div>

      {error && <div className="notice">{error}</div>}

      <div className="cards">
        <Card
          label="Assigned Tasks"
          value={tasks.length}
          icon="▤"
          color="blue"
          note="All your work items"
        />
        <Card
          label="Pending"
          value={tasks.filter((t) => t.status === "Pending").length}
          icon="◷"
          color="orange"
          note="Awaiting action"
        />
        <Card
          label="In Progress"
          value={tasks.filter((t) => t.status === "In Progress").length}
          icon="↗"
          color="purple"
          note="Currently working"
        />
        <Card
          label="Completed"
          value={completed}
          icon="✓"
          color="green"
          note={`${progress}% completion`}
        />
      </div>

      <section className="panel">
        <SectionHeading
          title="My Performance"
          subtitle="Your task completion progress"
        />

        <div className="employeeProgress">
          <div>
            <strong>{progress}%</strong>
            <span>Tasks completed</span>
          </div>
          <div className="barTrack">
            <div
              className="barFill departmentFill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <SectionHeading
          title="My Assigned Work"
          subtitle="View deadlines and update your task status"
          action={
            <button className="refreshBtn" onClick={load}>
              ↻ Refresh
            </button>
          }
        />

        {tasks.map((item) => (
          <div className="employeeTask" key={item.id}>
            <div className="employeeTaskInfo">
              <div className="taskTitleRow">
                <h3>{item.title}</h3>
                <StatusBadge status={item.status} />
              </div>

              <p>{item.description || "No description provided."}</p>

              <div className="taskMeta">
                <span>Priority: {item.priority}</span>
                <span>
                  Deadline:{" "}
                  {item.deadline
                    ? String(item.deadline).slice(0, 10)
                    : "—"}
                </span>
                {isOverdue(item) && (
                  <span className="overdueText">Overdue</span>
                )}
              </div>
            </div>

            <select
              value={item.status}
              onChange={(e) => change(item.id, e.target.value)}
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
        ))}

        {!tasks.length && (
          <div className="empty">
            {loading ? "Loading your tasks..." : "No work assigned yet."}
          </div>
        )}
      </section>
    </Shell>
  );
}

function App() {
  const [user, setUser] = useState(getUser);
  const [role, setRole] = useState(null);

  function logout() {
    localStorage.removeItem("ekUser");
    setUser(null);
    setRole(null);
  }

  if (user) {
    return user.role === "ADMIN" ? (
      <Admin user={user} logout={logout} />
    ) : (
      <Employee user={user} logout={logout} />
    );
  }

  if (role) {
    return (
      <Login
        role={role}
        back={() => setRole(null)}
        done={setUser}
      />
    );
  }

  return <Landing choose={setRole} />;
}

createRoot(document.getElementById("root")).render(<App />);
