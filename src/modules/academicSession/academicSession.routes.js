/**
 * Academic Session Routes
 *
 * Mounts at: /api/academic-sessions
 *
 * RBAC:
 *   admin       → full access (create, update, delete, activate)
 *   sub-admin, teacher → read-only
 */

const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");

const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

const {
  createSession,
  listSessions,
  getActiveSession,
  getSessionById,
  updateSession,
  deleteSession,
  activateSession,
} = require("./academicSession.controller");

const mongoId = (field) => param(field).isMongoId().withMessage(`Invalid ${field}`);

router.use(authGuard);

// GET /api/academic-sessions/active — must be declared before /:id
router.get(
  "/active",
  roleGuard("admin", "teacher"),
  getActiveSession
);

router.get(
  "/",
  roleGuard("admin", "teacher"),
  listSessions
);

router.post(
  "/",
  roleGuard("admin"),
  [
    body("name").notEmpty().trim().withMessage("Session name is required"),
    body("startDate").isISO8601().withMessage("Valid startDate is required"),
    body("endDate").isISO8601().withMessage("Valid endDate is required"),
  ],
  validate,
  createSession
);

router.put(
  "/:id/activate",
  roleGuard("admin"),
  [mongoId("id")],
  validate,
  activateSession
);

router.get(
  "/:id",
  roleGuard("admin", "teacher"),
  [mongoId("id")],
  validate,
  getSessionById
);

router.put(
  "/:id",
  roleGuard("admin"),
  [
    mongoId("id"),
    body("name").optional().notEmpty().trim().withMessage("Session name cannot be empty"),
    body("startDate").optional().isISO8601().withMessage("Valid startDate is required"),
    body("endDate").optional().isISO8601().withMessage("Valid endDate is required"),
  ],
  validate,
  updateSession
);

router.delete(
  "/:id",
  roleGuard("admin"),
  [mongoId("id")],
  validate,
  deleteSession
);

module.exports = router;
