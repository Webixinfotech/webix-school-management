const express = require("express");
const router = express.Router();

const {
  upsertActivity,
  getStudentActivity,
  getClassActivities,
  getStudentHistory,
  getTeacherHistory,
  getAllHistory,
  getDailySummary,
  deleteActivity,
} = require("./dailyActivity.controller");

const {
  upsertActivityValidation,
  getStudentActivityValidation,
  getClassActivitiesValidation,
  getStudentHistoryValidation,
  getTeacherHistoryValidation,
  getAllHistoryValidation,
  getDailySummaryValidation,
  deleteActivityValidation,
} = require("./dailyActivity.validators");

const { authGuard, roleGuard, teacherPermissionGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/daily-activity
// Teacher creates or updates today's activity report.
// Gated by canManageDailyActivity — the only route this permission needs to
// guard, since the "Daily Activity" teacher page's other reads (roster via
// GET /api/attendance, history via GET /student/:id) are shared with the
// parent role and must stay open regardless of this flag.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  authGuard,
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canManageDailyActivity"),
  upsertActivityValidation,
  validate,
  upsertActivity,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/daily-activity/summary?date=YYYY-MM-DD
// Admin: summary across all classes for a day
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/summary",
  authGuard,
  roleGuard("admin"),
  getDailySummaryValidation,
  validate,
  getDailySummary,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/daily-activity/class/:classId?date=YYYY-MM-DD
// Admin / teacher: all reports for a class on a day
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/class/:classId",
  authGuard,
  roleGuard("admin", "teacher"),
  getClassActivitiesValidation,
  validate,
  getClassActivities,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/daily-activity/student/:studentId?date=YYYY-MM-DD
// Admin / teacher / parent: single student report for a day
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/student/:studentId",
  authGuard,
  roleGuard("admin", "teacher", "parent"),
  getStudentActivityValidation,
  validate,
  getStudentActivity,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/daily-activity/student/:studentId/history
// Admin / teacher / parent: paginated history for a student
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/student/:studentId/history",
  authGuard,
  roleGuard("admin", "teacher", "parent"),
  getStudentHistoryValidation,
  validate,
  getStudentHistory,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/daily-activity/teacher/my-history
// Teacher: paginated history of activities submitted by the teacher
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/teacher/my-history",
  authGuard,
  roleGuard("teacher"),
  getTeacherHistoryValidation,
  validate,
  getTeacherHistory,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/daily-activity/history/all
// Admin/Sub-admin: paginated history of ALL activities with filters
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/history/all",
  authGuard,
  roleGuard("admin"),
  getAllHistoryValidation,
  validate,
  getAllHistory,
);


// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/daily-activity/:activityId
// Admin only: delete a report
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  "/:activityId",
  authGuard,
  roleGuard("admin"),
  deleteActivityValidation,
  validate,
  deleteActivity,
);

module.exports = router;