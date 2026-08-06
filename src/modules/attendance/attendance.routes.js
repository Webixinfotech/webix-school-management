const express = require("express");
const router = express.Router();

const {
  scanAttendance,
  manualMarkAttendance,
  getAttendanceList,
  getStudentAttendance,
  getDailySummary,
  updateAttendance,
  centerCheckIn,
  centerCheckOut,
} = require("./attendance.controller");

const {
  scanAttendanceValidation,
  manualAttendanceValidation,
  updateAttendanceValidation,
  getAttendanceListValidation,
  getStudentAttendanceValidation,
  getDailySummaryValidation,
  centerSessionValidation,
} = require("./attendance.validators");

const { authGuard, roleGuard, teacherPermissionGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

// NOTE: canMarkAttendance existed on the Teacher model but was never
// enforced by any route — it only hid the "Student Attendance" nav link
// on the frontend. Wiring it in here for real, on the write/summary
// endpoints only. GET "/" and GET "/student/:id" stay on roleGuard as-is
// because they're shared with the parent role (parents need read access
// to their own child's attendance regardless of a teacher's permission).
router.post(
  "/scan",
  authGuard,
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canMarkAttendance"),
  scanAttendanceValidation,
  validate,
  scanAttendance,
);

router.post(
  "/manual",
  authGuard,
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canMarkAttendance"),
  manualAttendanceValidation,
  validate,
  manualMarkAttendance,
);

router.get(
  "/summary/daily",
  authGuard,
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canMarkAttendance"),
  getDailySummaryValidation,
  validate,
  getDailySummary,
);

router.get(
  "/student/:id",
  authGuard,
  roleGuard("admin", "teacher", "parent"),
  getStudentAttendanceValidation,
  validate,
  getStudentAttendance,
);

router.get(
  "/",
  authGuard,
  roleGuard("admin", "teacher", "parent"),
  getAttendanceListValidation,
  validate,
  getAttendanceList,
);

router.put(
  "/:id",
  authGuard,
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canMarkAttendance"),
  updateAttendanceValidation,
  validate,
  updateAttendance,
);

// Center In/Out (Gate Tracking) Routes
router.post(
  "/center-in",
  authGuard,
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canMarkAttendance"),
  centerSessionValidation,
  validate,
  centerCheckIn,
);

router.post(
  "/center-out",
  authGuard,
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canMarkAttendance"),
  centerSessionValidation,
  validate,
  centerCheckOut,
);

module.exports = router;