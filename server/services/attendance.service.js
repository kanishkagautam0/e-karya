const pool = require("../db");

/* =========================
   GET ATTENDANCE
========================= */

async function getAttendance({ userId, from, to }) {
  let query = `
    SELECT
      a.id,
      a.user_id,
      u.name,
      u.email,
      u.employee_id,
      a.attendance_date,
      a.check_in,
      a.check_out,
      a.status,
      a.remarks,
      a.created_at,
      a.updated_at
    FROM attendance a
    INNER JOIN users u
      ON a.user_id = u.id
    WHERE 1 = 1
  `;

  const values = [];

  if (userId) {
    values.push(userId);
    query += ` AND a.user_id = $${values.length}`;
  }

  if (from) {
    values.push(from);
    query += ` AND a.attendance_date >= $${values.length}`;
  }

  if (to) {
    values.push(to);
    query += ` AND a.attendance_date <= $${values.length}`;
  }

  query += `
    ORDER BY a.attendance_date DESC, u.name ASC
  `;

  const result = await pool.query(query, values);

  return result.rows;
}

/* =========================
   CREATE ATTENDANCE
========================= */

async function createAttendance({
  userId,
  attendanceDate,
  checkIn,
  checkOut,
  status,
  remarks,
}) {
  const result = await pool.query(
    `
    INSERT INTO attendance
    (
      user_id,
      attendance_date,
      check_in,
      check_out,
      status,
      remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      userId,
      attendanceDate,
      checkIn || null,
      checkOut || null,
      status,
      remarks || null,
    ]
  );

  return result.rows[0];
}

/* =========================
   UPDATE ATTENDANCE
========================= */

async function updateAttendance(
  id,
  {
    attendanceDate,
    checkIn,
    checkOut,
    status,
    remarks,
  }
) {
  const result = await pool.query(
    `
    UPDATE attendance
    SET
      attendance_date = $1,
      check_in = $2,
      check_out = $3,
      status = $4,
      remarks = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *
    `,
    [
      attendanceDate,
      checkIn || null,
      checkOut || null,
      status,
      remarks || null,
      id,
    ]
  );

  return result.rows[0];
}

/* =========================
   DELETE ATTENDANCE
========================= */

async function deleteAttendance(id) {
  const result = await pool.query(
    `
    DELETE FROM attendance
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  return result.rows[0];
}

module.exports = {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};