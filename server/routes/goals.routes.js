const express = require("express");

const authenticateToken = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} = require("../controllers/goal.controller");

const router = express.Router();

router.get("/", authenticateToken, getGoals);

router.post("/", authenticateToken, createGoal);

router.put("/:id", authenticateToken, updateGoal);

router.delete(
  "/:id",
  authenticateToken,
  requireRole("ADMIN"),
  deleteGoal
);

module.exports = router;