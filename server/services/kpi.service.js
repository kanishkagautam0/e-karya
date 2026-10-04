const pool = require("../db");

async function getKPIs() {
  const result = await pool.query(`
    SELECT
      k.id,
      k.goal_id,
      k.title,
      k.description,
      k.target_value,
      k.current_value,
      k.unit,
      k.weight,
      k.status,
      k.start_date,
      k.deadline,
      k.created_at,
      g.title AS goal_title
    FROM kpis k
    LEFT JOIN goals g ON k.goal_id = g.id
    ORDER BY k.deadline ASC NULLS LAST, k.created_at DESC
  `);

  return result.rows;
}

async function createKPI(data) {
  const {
    goalId,
    title,
    description,
    targetValue,
    currentValue,
    unit,
    weight,
    status,
    startDate,
    deadline,
  } = data;

  const result = await pool.query(
    `
    INSERT INTO kpis (
      goal_id,
      title,
      description,
      target_value,
      current_value,
      unit,
      weight,
      status,
      start_date,
      deadline
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      goalId || null,
      title,
      description || null,
      targetValue || null,
      currentValue || 0,
      unit || null,
      weight || 100,
      status || "NOT_STARTED",
      startDate || null,
      deadline || null,
    ]
  );

  return result.rows[0];
}

async function updateKPI(id, data) {
  const {
    goalId,
    title,
    description,
    targetValue,
    currentValue,
    unit,
    weight,
    status,
    startDate,
    deadline,
  } = data;

  const result = await pool.query(
    `
    UPDATE kpis
    SET
      goal_id = $1,
      title = $2,
      description = $3,
      target_value = $4,
      current_value = $5,
      unit = $6,
      weight = $7,
      status = $8,
      start_date = $9,
      deadline = $10,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
    RETURNING *
    `,
    [
      goalId || null,
      title,
      description || null,
      targetValue || null,
      currentValue || 0,
      unit || null,
      weight || 100,
      status || "NOT_STARTED",
      startDate || null,
      deadline || null,
      id,
    ]
  );

  return result.rows[0];
}

async function deleteKPI(id) {
  const result = await pool.query(
    `
    DELETE FROM kpis
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  return result.rows[0];
}

module.exports = {
  getKPIs,
  createKPI,
  updateKPI,
  deleteKPI,
};