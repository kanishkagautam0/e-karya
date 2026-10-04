import { useEffect, useState } from "react";
import api from "../services/api";

function KPIs() {
  const [kpis, setKpis] = useState([]);
  const [goals, setGoals] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("%");
  const [goalId, setGoalId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [kpisResponse, goalsResponse] =
          await Promise.all([
            api.get("/kpis"),
            api.get("/goals"),
          ]);

        if (!mounted) return;

        const kpisData = Array.isArray(kpisResponse.data)
          ? kpisResponse.data
          : Array.isArray(kpisResponse.data?.kpis)
            ? kpisResponse.data.kpis
            : Array.isArray(kpisResponse.data?.data)
              ? kpisResponse.data.data
              : [];

        const goalsData = Array.isArray(goalsResponse.data)
          ? goalsResponse.data
          : Array.isArray(goalsResponse.data?.goals)
            ? goalsResponse.data.goals
            : Array.isArray(goalsResponse.data?.data)
              ? goalsResponse.data.data
              : [];

        setKpis(kpisData);
        setGoals(goalsData);
      } catch (err) {
        console.error("Load KPI data error:", err);

        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Failed to load KPI data."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setTarget("");
    setUnit("%");
    setGoalId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("KPI name is required.");
      return;
    }

    if (!target) {
      setError("Target is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/kpis", {
        name: name.trim(),
        description: description.trim(),
        target: Number(target),
        unit,
        goal_id: goalId ? Number(goalId) : null,
      });

      const createdKpi = response.data?.kpi;

      if (createdKpi) {
        setKpis((current) => [
          ...current,
          createdKpi,
        ]);
      } else {
        const refreshResponse = await api.get("/kpis");

        const refreshed = Array.isArray(refreshResponse.data)
          ? refreshResponse.data
          : Array.isArray(refreshResponse.data?.kpis)
            ? refreshResponse.data.kpis
            : Array.isArray(refreshResponse.data?.data)
              ? refreshResponse.data.data
              : [];

        setKpis(refreshed);
      }

      setMessage(
        response.data?.message ||
          "KPI created successfully."
      );

      resetForm();
    } catch (err) {
      console.error("Create KPI error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to create KPI."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this KPI?"
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await api.delete(`/kpis/${id}`);

      setKpis((current) =>
        current.filter(
          (kpi) => Number(kpi.id) !== Number(id)
        )
      );

      setMessage("KPI deleted successfully.");
    } catch (err) {
      console.error("Delete KPI error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete KPI."
      );
    }
  };

  const searchValue = search.toLowerCase().trim();

  const filteredKpis = kpis.filter((kpi) => {
    if (!searchValue) return true;

    return (
      kpi.name?.toLowerCase().includes(searchValue) ||
      kpi.description
        ?.toLowerCase()
        .includes(searchValue) ||
      kpi.goal_name
        ?.toLowerCase()
        .includes(searchValue)
    );
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <header style={styles.header}>
          <div>
            <div style={styles.label}>
              PERFORMANCE MANAGEMENT
            </div>

            <h1 style={styles.title}>KPIs</h1>

            <p style={styles.subtitle}>
              Define measurable performance indicators
              for organizational goals.
            </p>
          </div>

          <div style={styles.stat}>
            <strong style={styles.statNumber}>
              {kpis.length}
            </strong>

            <span style={styles.statText}>
              Total KPIs
            </span>
          </div>
        </header>

        {message && (
          <div style={styles.success}>
            {message}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.plus}>+</div>

            <div>
              <h2 style={styles.heading}>
                Add KPI
              </h2>

              <p style={styles.cardText}>
                Create a measurable performance indicator.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>

              <div style={styles.field}>
                <label style={styles.labelText}>
                  KPI Name
                </label>

                <input
                  style={styles.input}
                  type="text"
                  placeholder="Employee productivity"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />
              </div>

              <div style={styles.field}>
                <label style={styles.labelText}>
                  Goal
                </label>

                <select
                  style={styles.input}
                  value={goalId}
                  onChange={(event) =>
                    setGoalId(event.target.value)
                  }
                >
                  <option value="">
                    Select goal
                  </option>

                  {goals.map((goal) => (
                    <option
                      key={goal.id}
                      value={goal.id}
                    >
                      {goal.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.labelText}>
                  Target
                </label>

                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  placeholder="100"
                  value={target}
                  onChange={(event) =>
                    setTarget(event.target.value)
                  }
                />
              </div>

              <div style={styles.field}>
                <label style={styles.labelText}>
                  Unit
                </label>

                <select
                  style={styles.input}
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value)
                  }
                >
                  <option value="%">Percentage (%)</option>
                  <option value="Number">Number</option>
                  <option value="Hours">Hours</option>
                  <option value="Days">Days</option>
                  <option value="Tasks">Tasks</option>
                  <option value="Score">Score</option>
                </select>
              </div>

              <div
                style={{
                  ...styles.field,
                  gridColumn: "1 / -1",
                }}
              >
                <label style={styles.labelText}>
                  Description
                </label>

                <textarea
                  style={{
                    ...styles.input,
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                  placeholder="Describe what this KPI measures..."
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                />
              </div>

              <button
                style={styles.button}
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create KPI"}
              </button>

            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.heading}>
                KPI Directory
              </h2>

              <p style={styles.cardText}>
                View and manage performance indicators.
              </p>
            </div>

            <input
              style={styles.search}
              type="search"
              placeholder="Search KPIs..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {loading ? (
            <div style={styles.empty}>
              Loading KPIs...
            </div>
          ) : filteredKpis.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                K
              </div>

              <h3>No KPIs found</h3>

              <p>
                Create a KPI to start tracking
                performance.
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>KPI</th>
                    <th style={styles.th}>Goal</th>
                    <th style={styles.th}>Target</th>
                    <th style={styles.th}>Unit</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredKpis.map((kpi) => (
                    <tr key={kpi.id}>
                      <td style={styles.td}>
                        <strong>
                          {kpi.name}
                        </strong>

                        {kpi.description && (
                          <div style={styles.description}>
                            {kpi.description}
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>
                        {kpi.goal_name ||
                          kpi.goal?.name ||
                          "Not assigned"}
                      </td>

                      <td style={styles.td}>
                        {kpi.target ?? "—"}
                      </td>

                      <td style={styles.td}>
                        {kpi.unit || "—"}
                      </td>

                      <td style={styles.td}>
                        <button
                          style={styles.deleteButton}
                          type="button"
                          onClick={() =>
                            handleDelete(kpi.id)
                          }
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
        </section>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fa",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  label: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#667085",
    marginBottom: "8px",
  },

  title: {
    margin: "0",
    fontSize: "36px",
    color: "#172033",
  },

  subtitle: {
    marginTop: "8px",
    color: "#667085",
  },

  stat: {
    background: "#ffffff",
    padding: "18px 28px",
    borderRadius: "14px",
    textAlign: "center",
    boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
  },

  statNumber: {
    display: "block",
    fontSize: "28px",
    color: "#172033",
  },

  statText: {
    fontSize: "13px",
    color: "#667085",
  },

  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "24px",
    boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
  },

  cardHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    marginBottom: "24px",
  },

  plus: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "#4f46e5",
    fontWeight: "600",
  },

  heading: {
    margin: "0",
    color: "#172033",
    fontSize: "21px",
  },

  cardText: {
    margin: "5px 0 0",
    color: "#667085",
    fontSize: "14px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  labelText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#344054",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },

  button: {
    border: "none",
    borderRadius: "9px",
    padding: "13px 20px",
    background: "#172033",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  success: {
    background: "#ecfdf3",
    color: "#027a48",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  error: {
    background: "#fef3f2",
    color: "#b42318",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },

  search: {
    width: "260px",
    padding: "11px 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    fontSize: "14px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f9fafb",
    color: "#667085",
    fontSize: "13px",
  },

  td: {
    padding: "16px 14px",
    borderTop: "1px solid #eaecf0",
    color: "#344054",
    fontSize: "14px",
  },

  description: {
    marginTop: "4px",
    color: "#667085",
    fontSize: "12px",
  },

  deleteButton: {
    border: "1px solid #f04438",
    background: "#ffffff",
    color: "#d92d20",
    borderRadius: "7px",
    padding: "7px 12px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "50px 20px",
    color: "#667085",
  },

  emptyIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#f2f4f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
    fontWeight: "700",
    fontSize: "20px",
  },
};

export default KPIs;