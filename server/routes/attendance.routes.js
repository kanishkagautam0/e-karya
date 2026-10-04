const express = require("express");

const authenticateToken = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendance.controller");

const router = express.Router();

/* =========================
   GET ATTENDANCE

   ADMIN:
   Can view all attendance
   or filter by userId

   EMPLOYEE:
   Can only view own attendance
========================= */

router.get(
  "/",
  authenticateToken,
  getAttendance
);

/* =========================
   CREATE ATTENDANCE

   ADMIN:
   Can create for any employee

   EMPLOYEE:
   Can create for themselves
========================= */

router.post(
  "/",
  authenticateToken,
  createAttendance
);

/* =========================
   UPDATE ATTENDANCE

   ADMIN:
   Can update any record

   EMPLOYEE:
   Can update own record
========================= */

router.put(
  "/:id",
  authenticateToken,
  updateAttendance
);

/* =========================
   DELETE ATTENDANCE

   ADMIN ONLY
========================= */

router.delete(
  "/:id",
  authenticateToken,
  requireRole("ADMIN"),
  deleteAttendance
);

module.exports = router;