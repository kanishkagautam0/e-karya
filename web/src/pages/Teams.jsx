import { useEffect, useState } from "react";
import api from "../services/api";
import "./Teams.css";

function Teams() {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [teamsResponse, departmentsResponse] = await Promise.all([
          api.get("/teams"),
          api.get("/departments"),
        ]);

        if (cancelled) return;

        setTeams(teamsResponse.data);
        setDepartments(departmentsResponse.data);
      } catch (err) {
        if (cancelled) return;

        console.error("Teams loading error:", err);
        setError("Unable to load teams");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshTeams = async () => {
    try {
      const response = await api.get("/teams");
      setTeams(response.data);
    } catch (err) {
      console.error("Unable to refresh teams:", err);
      setError("Unable to refresh teams");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Team name is required");
      return;
    }

    if (!departmentId) {
      setError("Please select a department");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.post("/teams", {
        name: name.trim(),
        department_id: departmentId,
      });

      setName("");
      setDepartmentId("");
      setMessage("Team added successfully");

      await refreshTeams();
    } catch (err) {
      console.error("Add team error:", err);

      setError(
        err.response?.data?.message || "Unable to add team"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this team?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/teams/${id}`);

      setMessage("Team deleted successfully");

      await refreshTeams();
    } catch (err) {
      console.error("Delete team error:", err);

      setError(
        err.response?.data?.message || "Unable to delete team"
      );
    }
  };

  return (
    <div className="teams-page">
      <div className="teams-header">
        <div>
          <h1>Teams</h1>
          <p>Manage teams within departments</p>
        </div>
      </div>

      <form className="team-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter team name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <select
          value={departmentId}
          onChange={(event) => setDepartmentId(event.target.value)}
        >
          <option value="">Select Department</option>

          {departments.map((department) => (
            <option
              key={department.id}
              value={department.id}
            >
              {department.name}
            </option>
          ))}
        </select>

        <button type="submit" disabled={saving}>
          {saving ? "Adding..." : "Add Team"}
        </button>
      </form>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          Loading teams...
        </div>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          No teams found.
        </div>
      ) : (
        <div className="teams-table-wrapper">
          <table className="teams-table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>{team.name}</td>

                  <td>
                    {team.department?.name ||
                      team.department_name ||
                      "—"}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(team.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Teams;