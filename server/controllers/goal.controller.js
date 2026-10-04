const goalService = require("../services/goal.service");

async function getGoals(req, res) {
  try {
    const goals = await goalService.getGoals({
      departmentId: req.query.departmentId,
      teamId: req.query.teamId,
      employeeId: req.query.employeeId,
      status: req.query.status,
    });

    res.json(goals);
  } catch (error) {
    console.error("GET GOALS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch goals",
      code: error.code || null,
      detail: error.detail || null,
    });
  }
}

async function createGoal(req, res) {
  try {
    console.log("CREATE GOAL BODY:", req.body);

    const goal = await goalService.createGoal(req.body);

    res.status(201).json(goal);
  } catch (error) {
    console.error("CREATE GOAL ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create goal",
      code: error.code || null,
      detail: error.detail || null,
    });
  }
}

async function updateGoal(req, res) {
  try {
    const goal = await goalService.updateGoal(
      req.params.id,
      req.body
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    res.json(goal);
  } catch (error) {
    console.error("UPDATE GOAL ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update goal",
      code: error.code || null,
      detail: error.detail || null,
    });
  }
}

async function deleteGoal(req, res) {
  try {
    const goal = await goalService.deleteGoal(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    res.json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("DELETE GOAL ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete goal",
      code: error.code || null,
      detail: error.detail || null,
    });
  }
}

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};