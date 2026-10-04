const kpiService = require("../services/kpi.service");

async function getKPIs(req, res) {
  try {
    const kpis = await kpiService.getKPIs();

    res.json({
      success: true,
      kpis,
    });
  } catch (error) {
    console.error("Get KPIs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load KPIs",
    });
  }
}

async function createKPI(req, res) {
  try {
    if (!req.body.title || !req.body.title.trim()) {
      return res.status(400).json({
        success: false,
        message: "KPI title is required",
      });
    }

    const kpi = await kpiService.createKPI({
      ...req.body,
      title: req.body.title.trim(),
    });

    res.status(201).json({
      success: true,
      message: "KPI created successfully",
      kpi,
    });
  } catch (error) {
    console.error("Create KPI error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create KPI",
    });
  }
}

async function updateKPI(req, res) {
  try {
    const kpi = await kpiService.updateKPI(
      req.params.id,
      req.body
    );

    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: "KPI not found",
      });
    }

    res.json({
      success: true,
      message: "KPI updated successfully",
      kpi,
    });
  } catch (error) {
    console.error("Update KPI error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update KPI",
    });
  }
}

async function deleteKPI(req, res) {
  try {
    const kpi = await kpiService.deleteKPI(
      req.params.id
    );

    if (!kpi) {
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
}

module.exports = {
  getKPIs,
  createKPI,
  updateKPI,
  deleteKPI,
};