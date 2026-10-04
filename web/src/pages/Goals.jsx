
import { useEffect, useState } from "react";
import api from "../services/api";
import "./Goals.css";

function Goals() {
  const [goals, setGoals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("NOT_STARTED");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          goalsResponse,
          departmentsResponse,
          teamsResponse,
          employeesResponse,
        ] = await Promise.all([
          api.get("/goals"),
          api.get("/departments"),
          api.get("/teams"),
          api.get("/employees"),
        ]);

        if (!mounted) return;

        const goalsData = Array.isArray(goalsResponse.data)
          ? goalsResponse.data
          : Array.isArray(goalsResponse.data?.goals)
            ? goalsResponse.data.goals
            : Array.isArray(goalsResponse.data?.data)
              ? goalsResponse.data.data
              : [];

        const departmentsData = Array.isArray(
          departmentsResponse.data
        )
          ? departmentsResponse.data
          : Array.isArray(
                departmentsResponse.data?.departments
              )
            ? departmentsResponse.data.departments
            : Array.isArray(
                  departmentsResponse.data?.data
                )
              ? departmentsResponse.data.data
              : [];

        const teamsData = Array.isArray(teamsResponse.data)
          ? teamsResponse.data
          : Array.isArray(teamsResponse.data?.teams)
            ? teamsResponse.data.teams
            : Array.isArray(teamsResponse.data?.data)
              ? teamsResponse.data.data
              : [];

        const employeesData = Array.isArray(
          employeesResponse.data
        )
          ? employeesResponse.data
          : Array.isArray(
                employeesResponse.data?.employees
              )
            ? employeesResponse.data.employees
            : Array.isArray(
                  employeesResponse.data?.data
                )
              ? employeesResponse.data.data
              : [];

        setGoals(goalsData);
        setDepartments(departmentsData);
        setTeams(teamsData);
        setEmployees(employeesData);
      } catch (err) {
        console.error("Load goals data error:", err);

        if (mounted) {
          setError(
            err.response?.data?.detail ||
              err.response?.data?.message ||
              "Failed to load goals data"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDepartmentId("");
    setTeamId("");
    setEmployeeId("");
    setTargetValue("");
    setTargetUnit("");
    setPriority("MEDIUM");
    setStatus("NOT_STARTED");
    setStartDate("");
    setDeadline("");
  };

  // =========================
  // CREATE GOAL
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!title.trim()) {
      setError("Goal title is required.");
      return;
    }

    if (!departmentId) {
      setError("Department is required.");
      return;
    }

    if (!startDate) {
      setError("Start date is required.");
      return;
    }

    if (!deadline) {
      setError("Deadline is required.");
      return;
    }

    // =========================
    // DATE VALIDATION
    // =========================

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${deadline}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError("Please enter valid dates.");
      return;
    }

    if (end < start) {
      setError("Deadline cannot be before start date.");
      return;
    }

    // Prevent unrealistic dates
    const minimumYear = 2020;
    const maximumYear = new Date().getFullYear() + 10;

    if (
      start.getFullYear() < minimumYear ||
      start.getFullYear() > maximumYear ||
      end.getFullYear() < minimumYear ||
      end.getFullYear() > maximumYear
    ) {
      setError(
        `Please enter dates between ${minimumYear} and ${maximumYear}.`
      );
      return;
    }

    // =========================
    // CREATE REQUEST
    // =========================

    try {
      setSaving(true);

      const goalData = {
        title: title.trim(),
        description: description.trim() || null,

        departmentId: Number(departmentId),

        teamId: teamId
          ? Number(teamId)
          : null,

        employeeId: employeeId
          ? Number(employeeId)
          : null,

        targetValue: targetValue
          ? Number(targetValue)
          : null,

        targetUnit: targetUnit.trim() || null,

        priority,
        status,

        startDate,
        deadline,
      };

      console.log("SENDING GOAL:", goalData);

      const response = await api.post(
        "/goals",
        goalData
      );

      console.log(
        "CREATE GOAL RESPONSE:",
        response.data
      );

      const createdGoal =
        response.data?.goal ||
        response.data;

      if (createdGoal) {
        setGoals((current) => [
          ...current,
          createdGoal,
        ]);
      }

      setMessage(
        response.data?.message ||
          "Goal created successfully."
      );

      resetForm();
    } catch (err) {
      console.error(
        "Create goal error:",
        err
      );

      console.log(
        "SERVER RESPONSE:",
        err.response?.data
      );

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to create goal"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE GOAL
  // =========================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?"
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await api.delete(`/goals/${id}`);

      setGoals((current) =>
        current.filter(
          (goal) =>
            Number(goal.id) !== Number(id)
        )
      );

      setMessage(
        "Goal deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete goal error:",
        err
      );

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to delete goal"
      );
    }
  };

  // =========================
  // SEARCH
  // =========================

  const searchValue = search
    .toLowerCase()
    .trim();

  const filteredGoals = goals.filter(
    (goal) => {
      if (!searchValue) return true;

      return (
        goal.title
          ?.toLowerCase()
          .includes(searchValue) ||

        goal.description
          ?.toLowerCase()
          .includes(searchValue) ||

        goal.department_name
          ?.toLowerCase()
          .includes(searchValue) ||

        goal.team_name
          ?.toLowerCase()
          .includes(searchValue) ||

        goal.employee_name
          ?.toLowerCase()
          .includes(searchValue) ||

        goal.status
          ?.toLowerCase()
          .includes(searchValue)
      );
    }
  );

  // =========================
  // STATUS CLASS
  // =========================

  const getStatusClass = (
    goalStatus
  ) => {
    if (goalStatus === "COMPLETED") {
      return "goal-status completed";
    }

    if (goalStatus === "IN_PROGRESS") {
      return "goal-status progress";
    }

    if (goalStatus === "ON_HOLD") {
      return "goal-status hold";
    }

    return "goal-status not-started";
  };

  // =========================
  // PRIORITY CLASS
  // =========================

  const getPriorityClass = (
    goalPriority
  ) => {
    if (goalPriority === "HIGH") {
      return "goal-priority high";
    }

    if (goalPriority === "LOW") {
      return "goal-priority low";
    }

    if (goalPriority === "CRITICAL") {
      return "goal-priority high";
    }

    return "goal-priority medium";
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="goals-page">
      <div className="goals-container">

        {/* =========================
            HEADER
        ========================= */}

        <header className="goals-header">

          <div>
            <span className="goals-label">
              PERFORMANCE MANAGEMENT
            </span>

            <h1>Goals</h1>

            <p>
              Set, assign and track
              organizational goals.
            </p>
          </div>

          <div className="goal-stat">
            <strong>
              {goals.length}
            </strong>

            <span>
              Total Goals
            </span>
          </div>

        </header>

        {/* =========================
            MESSAGES
        ========================= */}

        {message && (
          <div className="goal-message success">
            {message}
          </div>
        )}

        {error && (
          <div className="goal-message error">
            {error}
          </div>
        )}

        {/* =========================
            CREATE GOAL
        ========================= */}

        <section className="goal-card">

          <div className="goal-card-heading">

            <div className="heading-icon">
              +
            </div>

            <div>
              <h2>
                Create Goal
              </h2>

              <p>
                Define a measurable goal
                and assign it to your
                organization.
              </p>
            </div>

          </div>

          <form
            className="goal-form"
            onSubmit={handleSubmit}
          >

            <div className="goal-form-grid">

              {/* TITLE */}

              <div className="field field-full">

                <label htmlFor="goal-title">
                  Goal Title
                </label>

                <input
                  id="goal-title"
                  type="text"
                  placeholder="Enter goal title"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

              {/* DESCRIPTION */}

              <div className="field field-full">

                <label htmlFor="goal-description">
                  Description
                </label>

                <textarea
                  id="goal-description"
                  placeholder="Describe the goal"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows="4"
                />

              </div>

              {/* DEPARTMENT */}

              <div className="field">

                <label htmlFor="goal-department">
                  Department
                </label>

                <select
                  id="goal-department"
                  value={departmentId}
                  onChange={(event) => {
                    setDepartmentId(
                      event.target.value
                    );

                    setTeamId("");
                    setEmployeeId("");
                  }}
                  required
                >

                  <option value="">
                    Select department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* TEAM */}

              <div className="field">

                <label htmlFor="goal-team">
                  Team
                </label>

                <select
                  id="goal-team"
                  value={teamId}
                  onChange={(event) =>
                    setTeamId(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select team
                  </option>

                  {teams
                    .filter((team) => {

                      if (!departmentId) {
                        return true;
                      }

                      return (
                        Number(
                          team.department_id
                        ) ===
                        Number(
                          departmentId
                        )
                      );
                    })
                    .map((team) => (
                      <option
                        key={team.id}
                        value={team.id}
                      >
                        {team.name}
                      </option>
                    ))}

                </select>

              </div>

              {/* EMPLOYEE */}

              <div className="field">

                <label htmlFor="goal-employee">
                  Employee
                </label>

                <select
                  id="goal-employee"
                  value={employeeId}
                  onChange={(event) =>
                    setEmployeeId(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select employee
                  </option>

                  {employees
                    .filter((employee) => {

                      if (!departmentId) {
                        return true;
                      }

                      return (
                        Number(
                          employee.department_id
                        ) ===
                        Number(
                          departmentId
                        )
                      );
                    })
                    .map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.name}
                      </option>
                    ))}

                </select>

              </div>

              {/* TARGET VALUE */}

              <div className="field">

                <label htmlFor="target-value">
                  Target Value
                </label>

                <input
                  id="target-value"
                  type="number"
                  min="0"
                  placeholder="100"
                  value={targetValue}
                  onChange={(event) =>
                    setTargetValue(
                      event.target.value
                    )
                  }
                />

              </div>

              {/* TARGET UNIT */}

              <div className="field">

                <label htmlFor="target-unit">
                  Target Unit
                </label>

                <input
                  id="target-unit"
                  type="text"
                  placeholder="Tasks / % / Projects"
                  value={targetUnit}
                  onChange={(event) =>
                    setTargetUnit(
                      event.target.value
                    )
                  }
                />

              </div>

              {/* PRIORITY */}

              <div className="field">

                <label htmlFor="goal-priority">
                  Priority
                </label>

                <select
                  id="goal-priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value
                    )
                  }
                >

                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>

                  <option value="CRITICAL">
                    Critical
                  </option>

                </select>

              </div>

              {/* STATUS */}

              <div className="field">

                <label htmlFor="goal-status">
                  Status
                </label>

                <select
                  id="goal-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                >

                  <option value="NOT_STARTED">
                    Not Started
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="ON_HOLD">
                    On Hold
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>

                </select>

              </div>

              {/* START DATE */}

              <div className="field">

                <label htmlFor="start-date">
                  Start Date
                </label>

                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  min="2020-01-01"
                  max="2036-12-31"
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

              {/* DEADLINE */}

              <div className="field">

                <label htmlFor="deadline">
                  Deadline
                </label>

                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  min={
                    startDate ||
                    "2020-01-01"
                  }
                  max="2036-12-31"
                  onChange={(event) =>
                    setDeadline(
                      event.target.value
                    )
                  }
                  required
                />

              </div>

            </div>

            {/* CREATE BUTTON */}

            <button
              className="goal-create-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Create Goal"}
            </button>

          </form>

        </section>

        {/* =========================
            GOAL DIRECTORY
        ========================= */}

        <section className="goal-card">

          <div className="goal-list-heading">

            <div>

              <h2>
                Goal Directory
              </h2>

              <p>
                View and manage all
                registered goals.
              </p>

            </div>

            <input
              className="goal-search"
              type="search"
              placeholder="Search goals..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="goal-loading">
              Loading goals...
            </div>

          ) : filteredGoals.length === 0 ? (

            <div className="goal-empty">

              <div className="empty-goal-icon">
                G
              </div>

              <h3>
                No goals found
              </h3>

              <p>
                Create a goal or change
                your search.
              </p>

            </div>

          ) : (

            <div className="goal-table-wrapper">

              <table className="goal-table">

                <thead>

                  <tr>
                    <th>Goal</th>
                    <th>Department</th>
                    <th>Team</th>
                    <th>Employee</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredGoals.map(
                    (goal) => (

                      <tr key={goal.id}>

                        {/* GOAL */}

                        <td>

                          <div className="goal-profile">

                            <strong>
                              {goal.title}
                            </strong>

                            {goal.description && (
                              <span>
                                {
                                  goal.description
                                }
                              </span>
                            )}

                          </div>

                        </td>

                        {/* DEPARTMENT */}

                        <td>
                          {goal.department_name ||
                            "Not assigned"}
                        </td>

                        {/* TEAM */}

                        <td>
                          {goal.team_name ||
                            "Not assigned"}
                        </td>

                        {/* EMPLOYEE */}

                        <td>
                          {goal.employee_name ||
                            "Not assigned"}
                        </td>

                        {/* PRIORITY */}

                        <td>

                          <span
                            className={getPriorityClass(
                              goal.priority
                            )}
                          >
                            {goal.priority ||
                              "MEDIUM"}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={getStatusClass(
                              goal.status
                            )}
                          >
                            {goal.status ||
                              "NOT_STARTED"}
                          </span>

                        </td>

                        {/* DEADLINE */}

                        <td>

                          {goal.deadline
                            ? new Date(
                                goal.deadline
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}

                        </td>

                        {/* DELETE */}

                        <td>

                          <button
                            className="goal-delete-button"
                            type="button"
                            onClick={() =>
                              handleDelete(
                                goal.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>
    </div>
  );
}

export default Goals;

