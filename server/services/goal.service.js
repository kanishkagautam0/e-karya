const pool = require("../db");

// =========================
// GET GOALS
// =========================

async function getGoals({
  departmentId,
  teamId,
  employeeId,
  status,
}) {
  let query = `
    SELECT
      g.*,
      d.name AS department_name,
      t.name AS team_name,
      u.name AS employee_name
    FROM goals g
    LEFT JOIN departments d
      ON g.department_id = d.id
    LEFT JOIN teams t
      ON g.team_id = t.id
    LEFT JOIN users u
      ON g.employee_id = u.id
    WHERE 1 = 1
  `;

  const values = [];

  if (departmentId) {
    values.push(departmentId);
    query += ` AND g.department_id = $${values.length}`;
  }

  if (teamId) {
    values.push(teamId);
    query += ` AND g.team_id = $${values.length}`;
  }

  if (employeeId) {
    values.push(employeeId);
    query += ` AND g.employee_id = $${values.length}`;
  }

  if (status) {
    values.push(status);
    query += ` AND g.status = $${values.length}`;
  }

  query += `
    ORDER BY
      g.deadline ASC NULLS LAST,
      g.created_at DESC
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

// =========================
// CREATE GOAL
// =========================

async function createGoal(data) {
  const {
    title,
    description,
    departmentId,
    teamId,
    employeeId,
    targetValue,
    targetUnit,
    priority,
    status,
    startDate,
    deadline,
  } = data;

  if (!title || !title.trim()) {
    throw new Error("Goal title is required");
  }

  if (!departmentId) {
    throw new Error("Department is required");
  }

  const result = await pool.query(
    `
    INSERT INTO goals
    (
      title,
      description,
      department_id,
      team_id,
      employee_id,
      target_value,
      target_unit,
      priority,
      status,
      start_date,
      deadline
    )
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
    `,
    [
      title.trim(),
      description || null,
      departmentId,
      teamId || null,
      employeeId || null,
      targetValue || null,
      targetUnit || null,
      priority || "MEDIUM",
      status || "NOT_STARTED",
      startDate || null,
      deadline || null,
    ]
  );

  return result.rows[0];
}

// =========================
// UPDATE GOAL
// =========================

async function updateGoal(id, data) {
  const {
    title,
    description,
    departmentId,
    teamId,
    employeeId,
    targetValue,
    targetUnit,
    priority,
    status,
    startDate,
    deadline,
  } = data;

  const result = await pool.query(
    `
    UPDATE goals
    SET
      title = $1,
      description = $2,
      department_id = $3,
      team_id = $4,
      employee_id = $5,
      target_value = $6,
      target_unit = $7,
      priority = $8,
      status = $9,
      start_date = $10,
      deadline = $11,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $12
    RETURNING *
    `,
    [
      title,
      description || null,
      departmentId,
      teamId || null,
      employeeId || null,
      targetValue || null,
      targetUnit || null,
      priority || "MEDIUM",
      status || "NOT_STARTED",
      startDate || null,
      deadline || null,
      id,
    ]
  );

  return result.rows[0];
}

// =========================
// DELETE GOAL
// =========================

async function deleteGoal(id) {
  const result = await pool.query(
    `
    DELETE FROM goals
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  return result.rows[0];
}

// =========================
// EXPORT
// =========================

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};