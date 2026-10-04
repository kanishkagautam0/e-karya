import { useEffect, useState } from "react";
import api from "../services/api";
import "./Departments.css";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/departments");

        if (!mounted) return;

        const data = response.data;

        const departmentList = Array.isArray(data)
          ? data
          : Array.isArray(data?.departments)
            ? data.departments
            : Array.isArray(data?.data)
              ? data.data
              : [];

        setDepartments(departmentList);
      } catch (err) {
        console.error(
          "Failed to load departments:",
          err
        );

        if (mounted) {
          setDepartments([]);

          setError(
            err.response?.data?.message ||
              "Unable to load departments"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Department name is required");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        "/departments",
        {
          name: name.trim(),
        }
      );

      const newDepartment =
        response.data?.department;

      if (newDepartment) {
        setDepartments((current) => [
          ...current,
          newDepartment,
        ]);
      } else {
        const refreshResponse =
          await api.get("/departments");

        const data = refreshResponse.data;

        const departmentList = Array.isArray(data)
          ? data
          : Array.isArray(data?.departments)
            ? data.departments
            : Array.isArray(data?.data)
              ? data.data
              : [];

        setDepartments(departmentList);
      }

      setName("");

      setMessage(
        response.data?.message ||
          "Department created successfully"
      );
    } catch (err) {
      console.error(
        "Create department error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to create department"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this department?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(
        `/departments/${id}`
      );

      setDepartments((current) =>
        current.filter(
          (department) =>
            Number(department.id) !== Number(id)
        )
      );

      setMessage(
        "Department deleted successfully"
      );
    } catch (err) {
      console.error(
        "Delete department error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to delete department"
      );
    }
  };

  return (
    <main className="departments-page">
      <div className="departments-container">

        <section className="departments-header">
          <div>
            <span className="page-label">
              ADMINISTRATION
            </span>

            <h1>Departments</h1>

            <p>
              Manage government departments and
              organizational structure.
            </p>
          </div>

          <div className="department-count">
            <span>{departments.length}</span>
            <small>Departments</small>
          </div>
        </section>

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

        <section className="department-card add-department-card">

          <div className="card-heading">
            <div className="heading-icon">
              +
            </div>

            <div>
              <h2>Add Department</h2>

              <p>
                Create a new department for your
                organization.
              </p>
            </div>
          </div>

          <form
            className="department-form"
            onSubmit={handleSubmit}
          >
            <div className="input-wrapper">
              <label htmlFor="department-name">
                Department Name
              </label>

              <input
                id="department-name"
                type="text"
                placeholder="e.g. Human Resources"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="add-button"
              disabled={saving}
            >
              {saving
                ? "Adding..."
                : "Add Department"}
            </button>
          </form>
        </section>

        <section className="department-card">

          <div className="list-header">
            <div>
              <h2>All Departments</h2>

              <p>
                View and manage registered
                departments.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loader"></div>

              <p>
                Loading departments...
              </p>
            </div>
          ) : departments.length === 0 ? (
            <div className="empty-state">

              <div className="empty-icon">
                D
              </div>

              <h3>
                No departments yet
              </h3>

              <p>
                Add your first department using
                the form above.
              </p>

            </div>
          ) : (
            <div className="department-list">

              {departments.map(
                (department, index) => (
                  <div
                    className="department-row"
                    key={department.id}
                  >
                    <div className="department-info">

                      <div className="department-number">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div>
                        <h3>
                          {department.name}
                        </h3>

                        <span>
                          Department ID:{" "}
                          {department.id}
                        </span>
                      </div>

                    </div>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        handleDelete(
                          department.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

export default Departments;