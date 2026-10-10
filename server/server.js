import express from "express";
import cors from "cors";
import pg from "pg";
import "dotenv/config";

const app = express();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  })
);

app.use(express.json());

// Convert PostgreSQL user columns to the format used by the frontend
function formatUser(user) {
  return {
    id: user.id,
    employeeId: user.employee_id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
  };
}

// Convert PostgreSQL task columns to the format used by the frontend
function formatTask(task) {
  return {
    id: task.id,
    userId: task.userId,
    employeeId: task.employeeId,
    employeeName: task.employeeName,
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: task.deadline || "",
    status: task.status,
  };
}

// Admin access middleware
function admin(req, res, next) {
  if (req.headers["x-role"] !== "ADMIN") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      ok: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      ok: false,
      message: "Database connection failed",
    });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const result = await pool.query(
      `SELECT id, employee_id, name, email, password,
              role, department, designation
       FROM users
       WHERE LOWER(email) = LOWER($1)
         AND password = $2
         AND role = $3
       LIMIT 1`,
      [email || "", password || "", role || ""]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email, password or role",
      });
    }

    res.json({
      user: formatUser(result.rows[0]),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

// Get all employees (Admin only)
app.get("/api/users", admin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_id, name, email, role,
              department, designation
       FROM users
       WHERE role = 'USER'
       ORDER BY id DESC`
    );

    res.json(result.rows.map(formatUser));
  } catch (error) {
    console.error("Get users error:", error.message);

    res.status(500).json({
      message: "Could not fetch employees",
    });
  }
});

// Create employee (Admin only)
app.post("/api/users", admin, async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      password,
      department,
      designation,
    } = req.body;

    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({
        message: "Employee ID, name, email and password are required",
      });
    }

    const existing = await pool.query(
      `SELECT id FROM users
       WHERE LOWER(email) = LOWER($1)
          OR employee_id = $2
       LIMIT 1`,
      [email, employeeId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "Employee ID or email already exists",
      });
    }

    // Generate an ID larger than existing migrated IDs
    const idResult = await pool.query(
      "SELECT COALESCE(MAX(id), 0) + 1 AS id FROM users"
    );

    const result = await pool.query(
      `INSERT INTO users
       (id, employee_id, name, email, password, role, department, designation)
       VALUES ($1, $2, $3, $4, $5, 'USER', $6, $7)
       RETURNING id, employee_id, name, email, role, department, designation`,
      [
        idResult.rows[0].id,
        employeeId,
        name,
        email,
        password,
        department || "General",
        designation || "Employee",
      ]
    );

    res.status(201).json(formatUser(result.rows[0]));
  } catch (error) {
    console.error("Create employee error:", error.message);

    res.status(500).json({
      message: "Could not create employee",
    });
  }
});

// Get tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const role = req.headers["x-role"];
    const userId = req.headers["x-user-id"];

    let result;

    if (role === "ADMIN") {
      result = await pool.query(
        `SELECT id, assigned_to AS "userId",
                employee_id AS "employeeId",
                employee_name AS "employeeName",
                title, description, priority, deadline, status
         FROM tasks
         ORDER BY id DESC`
      );
    } else {
      if (!userId) {
        return res.status(401).json({
          message: "User ID is required",
        });
      }

      result = await pool.query(
        `SELECT id, assigned_to AS "userId",
                employee_id AS "employeeId",
                employee_name AS "employeeName",
                title, description, priority, deadline, status
         FROM tasks
         WHERE assigned_to = $1
         ORDER BY id DESC`,
        [userId]
      );
    }

    res.json(result.rows.map(formatTask));
  } catch (error) {
    console.error("Get tasks error:", error.message);

    res.status(500).json({
      message: "Could not fetch tasks",
    });
  }
});

// Create and assign a task (Admin only)
app.post("/api/tasks", admin, async (req, res) => {
  try {
    const {
      userId,
      title,
      description,
      priority,
      deadline,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "Select an employee",
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const userResult = await pool.query(
      `SELECT id, employee_id, name
       FROM users
       WHERE id = $1 AND role = 'USER'`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Select a valid employee",
      });
    }

    const employee = userResult.rows[0];

    const idResult = await pool.query(
      "SELECT COALESCE(MAX(id), 0) + 1 AS id FROM tasks"
    );

    const result = await pool.query(
      `INSERT INTO tasks
       (id, assigned_to, employee_id, employee_name,
        title, description, priority, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')
       RETURNING id, assigned_to AS "userId",
                 employee_id AS "employeeId",
                 employee_name AS "employeeName",
                 title, description, priority, deadline, status`,
      [
        idResult.rows[0].id,
        employee.id,
        employee.employee_id,
        employee.name,
        title,
        description || "",
        priority || "Medium",
        deadline || null,
      ]
    );

    res.status(201).json(formatTask(result.rows[0]));
  } catch (error) {
    console.error("Create task error:", error.message);

    res.status(500).json({
      message: "Could not create task",
    });
  }
});

// Update task status
app.patch("/api/tasks/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const role = req.headers["x-role"];
    const userId = req.headers["x-user-id"];

    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    let result;

    if (role === "ADMIN") {
      result = await pool.query(
        `UPDATE tasks
         SET status = $1
         WHERE id = $2
         RETURNING id, assigned_to AS "userId",
                   employee_id AS "employeeId",
                   employee_name AS "employeeName",
                   title, description, priority, deadline, status`,
        [status, req.params.id]
      );
    } else {
      result = await pool.query(
        `UPDATE tasks
         SET status = $1
         WHERE id = $2 AND assigned_to = $3
         RETURNING id, assigned_to AS "userId",
                   employee_id AS "employeeId",
                   employee_name AS "employeeName",
                   title, description, priority, deadline, status`,
        [status, req.params.id, userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found or you are not allowed to update it",
      });
    }

    res.json(formatTask(result.rows[0]));
  } catch (error) {
    console.error("Update task error:", error.message);

    res.status(500).json({
      message: "Could not update task",
    });
  }
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`e-Karya API running at http://localhost:${PORT}`);
});