const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =========================
// ROUTES
// =========================

const authRoutes = require("./routes/auth.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const goalRoutes = require("./routes/goals.routes");
const kpiRoutes = require("./routes/kpi.routes");

// =========================
// MIDDLEWARE
// =========================

const authenticateToken = require("./middleware/auth.middleware");
const { requireRole } = require("./middleware/role.middleware");

// =========================
// CORS
// =========================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// =========================
// BODY PARSER
// =========================

app.use(express.json());

// =========================
// DATABASE
// =========================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

// =========================
// DATABASE TEST
// =========================

app.get("/api/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");

    res.json({
      success: true,
      message: "Database connection successful",
      time: result.rows[0].time,
    });
  } catch (error) {
    console.error("Database health error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// =========================
// AUTH ROUTES
// =========================

app.use("/api/auth", authRoutes);

// =========================
// ATTENDANCE ROUTES
// =========================

app.use("/api/attendance", attendanceRoutes);

// =========================
// GOAL ROUTES
// =========================

app.use("/api/goals", goalRoutes);

// =========================
// KPI ROUTES
// =========================

// =========================
// KPI ROUTES
// =========================

app.use(
  "/api/kpis",
  authenticateToken,
  kpiRoutes
);



// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "e-Karya API is running",
  });
});

// =========================
// DEPARTMENTS - GET
// =========================

app.get(
  "/api/departments",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          name
        FROM departments
        ORDER BY id
      `);

      res.json({
        success: true,
        departments: result.rows,
      });
    } catch (error) {
      console.error("Get departments error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to load departments",
      });
    }
  }
);

// =========================
// DEPARTMENT - CREATE
// =========================

app.post(
  "/api/departments",
  authenticateToken,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department name is required",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO departments (name)
        VALUES ($1)
        RETURNING id, name
        `,
        [name.trim()]
      );

      res.status(201).json({
        success: true,
        message: "Department created successfully",
        department: result.rows[0],
      });
    } catch (error) {
      console.error("Create department error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Department already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create department",
      });
    }
  }
);

// =========================
// DEPARTMENT - DELETE
// =========================

app.delete(
  "/api/departments/:id",
  authenticateToken,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        DELETE FROM departments
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }

      res.json({
        success: true,
        message: "Department deleted successfully",
      });
    } catch (error) {
      console.error("Delete department error:", error);

      if (error.code === "23503") {
        return res.status(409).json({
          success: false,
          message:
            "Department cannot be deleted because it is being used",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete department",
      });
    }
  }
);

// =========================
// EMPLOYEES - GET
// =========================

app.get(
  "/api/employees",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.role,
          u.department_id,
          u.employee_id,
          d.name AS department_name
        FROM users u
        LEFT JOIN departments d
          ON u.department_id = d.id
        ORDER BY u.id
      `);

      res.json({
        success: true,
        employees: result.rows,
      });
    } catch (error) {
      console.error("Get employees error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to load employees",
      });
    }
  }
);

// =========================
// EMPLOYEE - CREATE
// =========================

app.post(
  "/api/employees",
  authenticateToken,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
        department_id,
        employee_id,
      } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email, password and role are required",
        });
      }

      const existingUser = await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
        `,
        [email.trim()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      const bcrypt = require("bcrypt");

      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      const result = await pool.query(
        `
        INSERT INTO users
        (
          name,
          email,
          password,
          role,
          department_id,
          employee_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          name,
          email,
          role,
          department_id,
          employee_id
        `,
        [
          name.trim(),
          email.trim(),
          hashedPassword,
          role,
          department_id || null,
          employee_id || null,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        employee: result.rows[0],
      });
    } catch (error) {
      console.error("Create employee error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "Email or employee ID already exists",
        });
      }

      if (error.code === "23503") {
        return res.status(400).json({
          success: false,
          message: "Invalid department",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create employee",
      });
    }
  }
);

// =========================
// EMPLOYEE - DELETE
// =========================

app.delete(
  "/api/employees/:id",
  authenticateToken,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (Number(id) === Number(req.user.id)) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own admin account",
        });
      }

      const result = await pool.query(
        `
        DELETE FROM users
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      res.json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      console.error("Delete employee error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete employee",
      });
    }
  }
);

// =========================
// TEAMS - GET
// =========================

app.get(
  "/api/teams",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          t.id,
          t.name,
          t.department_id,
          d.name AS department_name
        FROM teams t
        LEFT JOIN departments d
          ON t.department_id = d.id
        ORDER BY t.id
      `);

      res.json({
        success: true,
        teams: result.rows,
      });
    } catch (error) {
      console.error("Get teams error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to load teams",
      });
    }
  }
);

// =========================
// TEAM - CREATE
// =========================

app.post(
  "/api/teams",
  authenticateToken,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { name, department_id } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Team name is required",
        });
      }

      if (!department_id) {
        return res.status(400).json({
          success: false,
          message: "Department is required",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO teams
        (
          name,
          department_id
        )
        VALUES ($1, $2)
        RETURNING
          id,
          name,
          department_id
        `,
        [name.trim(), department_id]
      );

      res.status(201).json({
        success: true,
        message: "Team created successfully",
        team: result.rows[0],
      });
    } catch (error) {
      console.error("Create team error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Team already exists",
        });
      }

      if (error.code === "23503") {
        return res.status(400).json({
          success: false,
          message: "Invalid department",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create team",
      });
    }
  }
);

// =========================
// TEAM - DELETE
// =========================

app.delete(
  "/api/teams/:id",
  authenticateToken,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        DELETE FROM teams
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      res.json({
        success: true,
        message: "Team deleted successfully",
      });
    } catch (error) {
      console.error("Delete team error:", error);

      if (error.code === "23503") {
        return res.status(409).json({
          success: false,
          message:
            "Team cannot be deleted because it is being used",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to delete team",
      });
    }
  }
);

// =========================
// 404 HANDLER
// =========================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =========================
// GLOBAL ERROR HANDLER
// =========================

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  if (
    error instanceof SyntaxError &&
    error.status === 400
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(
    `e-Karya server running on http://localhost:${PORT}`
  );
});