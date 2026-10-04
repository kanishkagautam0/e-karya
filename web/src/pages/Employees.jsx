import { useEffect, useState } from "react";
import api from "../services/api";
import "./Employees.css";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [photoPreview, setPhotoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [employeesResponse, departmentsResponse] =
          await Promise.all([
            api.get("/employees"),
            api.get("/departments"),
          ]);

        if (!mounted) return;

        const employeeData = employeesResponse.data;
        const departmentData = departmentsResponse.data;

        const employeesList = Array.isArray(employeeData)
          ? employeeData
          : Array.isArray(employeeData?.employees)
            ? employeeData.employees
            : Array.isArray(employeeData?.data)
              ? employeeData.data
              : [];

        const departmentsList = Array.isArray(departmentData)
          ? departmentData
          : Array.isArray(departmentData?.departments)
            ? departmentData.departments
            : Array.isArray(departmentData?.data)
              ? departmentData.data
              : [];

        setEmployees(employeesList);
        setDepartments(departmentsList);
        setError("");
      } catch (err) {
        console.error("Load employees error:", err);

        if (mounted) {
          setEmployees([]);
          setDepartments([]);

          setError(
            err.response?.data?.message ||
              "Failed to load employees."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be smaller than 5 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setPhotoPreview(previewUrl);
    setError("");
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("EMPLOYEE");
    setDepartmentId("");
    setEmployeeId("");
    setPhotoPreview("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Employee name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (!role) {
      setError("Role is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/employees", {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        department_id: departmentId
          ? Number(departmentId)
          : null,
        employee_id: employeeId.trim() || null,
      });

      const createdEmployee = response.data?.employee;

      if (createdEmployee) {
        setEmployees((current) => [
          ...current,
          {
            ...createdEmployee,
            photo: photoPreview || null,
          },
        ]);
      }

      setMessage(
        response.data?.message ||
          "Employee created successfully."
      );

      resetForm();
    } catch (err) {
      console.error("Create employee error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to create employee."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await api.delete(`/employees/${id}`);

      setEmployees((current) =>
        current.filter(
          (employee) =>
            Number(employee.id) !== Number(id)
        )
      );

      setMessage("Employee deleted successfully.");
    } catch (err) {
      console.error("Delete employee error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete employee."
      );
    }
  };

  const searchValue = search.toLowerCase().trim();

  const filteredEmployees = employees.filter((employee) => {
    if (!searchValue) return true;

    return (
      employee.name
        ?.toLowerCase()
        .includes(searchValue) ||
      employee.email
        ?.toLowerCase()
        .includes(searchValue) ||
      employee.employee_id
        ?.toLowerCase()
        .includes(searchValue) ||
      employee.department_name
        ?.toLowerCase()
        .includes(searchValue)
    );
  });

  const getInitials = (employeeName) => {
    if (!employeeName) return "E";

    return employeeName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="employees-page">
      <div className="employees-container">

        <header className="employees-header">
          <div>
            <span className="employees-label">
              ORGANIZATION
            </span>

            <h1>Employees</h1>

            <p>
              Manage employees and their
              organizational information.
            </p>
          </div>

          <div className="employee-stat">
            <strong>{employees.length}</strong>
            <span>Total Employees</span>
          </div>
        </header>

        {message && (
          <div className="employee-message success">
            {message}
          </div>
        )}

        {error && (
          <div className="employee-message error">
            {error}
          </div>
        )}

        <section className="employee-card">

          <div className="employee-card-heading">
            <div className="heading-icon">+</div>

            <div>
              <h2>Add Employee</h2>

              <p>
                Create a new employee account.
              </p>
            </div>
          </div>

          <form
            className="employee-form"
            onSubmit={handleSubmit}
          >
            <div className="photo-section">

              <div className="photo-preview">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Employee preview"
                  />
                ) : (
                  <span>PHOTO</span>
                )}
              </div>

              <label
                className="photo-button"
                htmlFor="employee-photo"
              >
                Choose Photo
              </label>

              <input
                id="employee-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                hidden
              />

              <small>
                JPG, PNG up to 5 MB
              </small>
            </div>

            <div className="employee-fields">

              <div className="field">
                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="employee-id">
                  Employee ID
                </label>

                <input
                  id="employee-id"
                  type="text"
                  placeholder="EMP001"
                  value={employeeId}
                  onChange={(event) =>
                    setEmployeeId(event.target.value)
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="employee@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="role">
                  Role
                </label>

                <select
                  id="role"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value)
                  }
                >
                  <option value="EMPLOYEE">
                    Employee
                  </option>

                  <option value="MANAGER">
                    Manager
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="department">
                  Department
                </label>

                <select
                  id="department"
                  value={departmentId}
                  onChange={(event) =>
                    setDepartmentId(event.target.value)
                  }
                >
                  <option value="">
                    Select department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="employee-create-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Creating..."
                  : "Create Employee"}
              </button>

            </div>
          </form>
        </section>

        <section className="employee-card">

          <div className="employee-list-heading">
            <div>
              <h2>Employee Directory</h2>

              <p>
                View and manage registered
                employees.
              </p>
            </div>

            <input
              className="employee-search"
              type="search"
              placeholder="Search employees..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {loading ? (
            <div className="employee-loading">
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="employee-empty">

              <div className="empty-avatar">
                E
              </div>

              <h3>
                No employees found
              </h3>

              <p>
                Add an employee or change your
                search.
              </p>

            </div>
          ) : (
            <div className="employee-table-wrapper">

              <table className="employee-table">

                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>

                      <td>
                        <div className="employee-profile">

                          {employee.photo ? (
                            <img
                              className="employee-avatar"
                              src={employee.photo}
                              alt={employee.name}
                            />
                          ) : (
                            <div className="employee-avatar initials">
                              {getInitials(employee.name)}
                            </div>
                          )}

                          <div>
                            <strong>
                              {employee.name}
                            </strong>

                            <span>
                              {employee.email}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        {employee.employee_id || "—"}
                      </td>

                      <td>
                        {employee.department_name ||
                          employee.department ||
                          "Not assigned"}
                      </td>

                      <td>
                        <span className="role-badge">
                          {employee.role}
                        </span>
                      </td>

                      <td>
                        <button
                          className="employee-delete-button"
                          type="button"
                          onClick={() =>
                            handleDelete(employee.id)
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

export default Employees;