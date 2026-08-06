const express = require("express");
const router = express.Router();
const { getAuditLogs, getTargetLogs } = require("./audit.controller");
const { authGuard, roleGuard } = require("../../middleware/auth.middleware");

// Protect all routes
router.use(authGuard);

// Admin only routes
router.get("/logs", roleGuard("admin"), getAuditLogs);
router.get(
  "/logs/target/:model/:id",
  roleGuard("admin"),
  getTargetLogs,
);

module.exports = router;
