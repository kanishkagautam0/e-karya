
const express = require("express");
const { Pool } = require("pg");

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// =========================
// GET ALL KPIs
// =========================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        k.id,
        k.name,
        k.description,
        k.goal_id,
        k.department_id,
        k.team_id,
        k.employee_id,
        k.target_value,
        k.current_value,
        k.unit,
        k.frequency,
        k.status,
        k.start_date,
        k.deadline,
        k.created_at,
        k.updated_at,

        g.title AS goal_name,
        d.name AS department_name,
        t.name AS team_name,
        u.name AS employee_name

      FROM kpis k

      LEFT JOIN goals g
        ON k.goal_id = g.id

      LEFT JOIN departments d
        ON k.department_id = d.id

      LEFT JOIN teams t
        ON k.team_id = t.id

      LEFT JOIN users u
        ON k.employee_id = u.id

      ORDER BY k.id DESC
    `);

    res.json({
      success: true,
      kpis: result.rows,
    });
  } catch (error) {
    console.error("Get KPIs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load KPIs",
    });
  }
});

// =========================
// CREATE KPI
// =========================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      goalId,
      departmentId,
      teamId,
      employeeId,
      targetValue,
      currentValue,
      unit,
      frequency,
      status,
      startDate,
      deadline,
    } = req.body;

    console.log("CREATE KPI BODY:", req.body);

    // Required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "KPI name is required",
      });
    }

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department is required",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Start date is required",
      });
    }

    if (!deadline) {
      return res.status(400).json({
        success: false,
        message: "Deadline is required",
      });
    }

    if (new Date(deadline) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Deadline cannot be before start date",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO kpis (
        name,
        description,
        goal_id,
        department_id,
        team_id,
        employee_id,
        target_value,
        current_value,
        unit,
        frequency,
        status,
        start_date,
        deadline
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING *
      `,
      [
        name.trim(),
        description?.trim() || null,
        goalId ? Number(goalId) : null,
        Number(departmentId),
        teamId ? Number(teamId) : null,
        employeeId ? Number(employeeId) : null,
        targetValue !== "" && targetValue != null
          ? Number(targetValue)
          : null,
        currentValue !== "" && currentValue != null
          ? Number(currentValue)
          : 0,
        unit?.trim() || null,
        frequency || "MONTHLY",
        status || "ACTIVE",
        startDate,
        deadline,
      ]
    );

    res.status(201).json({
      success: true,
      message: "KPI created successfully",
      kpi: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE KPI DATABASE ERROR:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid goal, department, team or employee",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid KPI frequency or status",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create KPI",
    });
  }
});

// =========================
// DELETE KPI
// =========================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM kpis
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "KPI not found",
      });
    }

    res.json({
      success: true,
      message: "KPI deleted successfully",
    });
  } catch (error) {
    console.error("Delete KPI error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete KPI",
    });
  }
});

module.exports = router;

