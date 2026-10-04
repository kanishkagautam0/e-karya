const attendanceService = require("../services/attendance.service");

/* =========================
   GET ATTENDANCE
========================= */

async function getAttendance(req, res) {
  try {
    const requestedUserId = req.query.userId;

    // Employee can only view their own attendance
    // Admin can view any employee's attendance
    let userId = requestedUserId;

    if (req.user.role !== "ADMIN") {
      userId = req.user.id;
    }

    const attendance = await attendanceService.getAttendance({
      userId,
      from: req.query.from,
      to: req.query.to,
    });

    res.json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load attendance",
    });
  }
}

/* =========================
   CREATE ATTENDANCE
========================= */

async function createAttendance(req, res) {
  try {
    const {
      userId,
      attendanceDate,
      checkIn,
      checkOut,
      status,
      remarks,
    } = req.body;

    // Employee can only create attendance for themselves
    const targetUserId =
      req.user.role === "ADMIN"
        ? userId
        : req.user.id;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!attendanceDate || !status) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance date and status are required",
      });
    }

    const allowedStatuses = [
      "PRESENT",
      "ABSENT",
      "HALF_DAY",
      "LEAVE",
      "HOLIDAY",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }

    const attendance =
      await attendanceService.createAttendance({
        userId: targetUserId,
        attendanceDate,
        checkIn,
        checkOut,
        status,
        remarks,
      });

    res.status(201).json({
      success: true,
      message: "Attendance created successfully",
      attendance,
    });
  } catch (error) {
    console.error("Create attendance error:", error);

    // Duplicate attendance for same user/date
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "Attendance already exists for this employee and date",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create attendance",
    });
  }
}

/* =========================
   UPDATE ATTENDANCE
========================= */

async function updateAttendance(req, res) {
  try {
    const { id } = req.params;

    const {
      attendanceDate,
      checkIn,
      checkOut,
      status,
      remarks,
    } = req.body;

    if (!attendanceDate || !status) {
      return res.status(400).json({
        success: false,
        message:
          "Attendance date and status are required",
      });
    }

    const allowedStatuses = [
      "PRESENT",
      "ABSENT",
      "HALF_DAY",
      "LEAVE",
      "HOLIDAY",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }

    // Check ownership for employees
    if (req.user.role !== "ADMIN") {
      const existing =
        await attendanceService.getAttendance({
          userId: req.user.id,
        });

      const record = existing.find(
        (item) => Number(item.id) === Number(id)
      );

      if (!record) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update your own attendance",
        });
      }
    }

    const attendance =
      await attendanceService.updateAttendance(id, {
        attendanceDate,
        checkIn,
        checkOut,
        status,
        remarks,
      });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    res.json({
      success: true,
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    console.error("Update attendance error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "Attendance already exists for this employee and date",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update attendance",
    });
  }
}

/* =========================
   DELETE ATTENDANCE
   ADMIN ONLY
========================= */

async function deleteAttendance(req, res) {
  try {
    const { id } = req.params;

    const deleted =
      await attendanceService.deleteAttendance(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    res.json({
      success: true,
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    console.error("Delete attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete attendance",
    });
  }
}

module.exports = {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};