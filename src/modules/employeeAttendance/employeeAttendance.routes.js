

//----------------------new code-------------------------//

const express = require("express");
const router = express.Router();

const {
  getCurrentQR,
  scanQR,
  scanStaticQR,
  manualMark,
  getDailySummary,
  getEmployeeHistory,
  deleteRecord,
} = require("./employeeAttendance.controller");

const {
  authGuard,
  roleGuard,
  teacherPermissionGuard,
} = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { body, param, query } = require("express-validator");
const Teacher = require("../teacher/teacher.model");
const ErrorResponse = require("../../utils/errorResponse");

// ─── Custom Middleware: Admin OR teacher with canDisplayStaffQR permission ───
const qrDisplayGuard = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role === "admin") return next();

    if (user.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: user._id })
        .select("permissions.canDisplayStaffQR")
        .lean();

      if (teacher?.permissions?.canDisplayStaffQR === true) return next();
    }

    return next(
      new ErrorResponse("You do not have permission to view the QR", 403),
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employee-attendance/qr
// Admin + teachers with canDisplayStaffQR permission
// ─────────────────────────────────────────────────────────────────────────────
router.get("/qr", authGuard, qrDisplayGuard, getCurrentQR);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/employee-attendance/scan
// Teacher scans QR — handles both check-in and check-out automatically
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/scan",
  authGuard,
  roleGuard("teacher"),
  teacherPermissionGuard("attendanceViaPhone"),
  [
    body("token")
      .notEmpty()
      .withMessage("QR token is required")
      .isLength({ min: 8, max: 32 }),
    body("location.lat")
      .optional({ nullable: true })
      .isFloat({ min: -90, max: 90 }),
    body("location.lng")
      .optional({ nullable: true })
      .isFloat({ min: -180, max: 180 }),
  ],
  validate,
  scanQR,
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/employee-attendance/scan-by-id-card
// Admin, or a teacher with canScanEmployeeQR permission, scans ANOTHER
// employee's static ID-card QR (Teacher.qrCode) to mark that employee's
// attendance — for staff without a phone. The scanned employee must
// themselves have permissions.attendanceViaQR enabled (checked in the
// service layer, since it depends on the SCANNED teacher, not req.user).
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/scan-by-id-card",
  authGuard,
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canScanEmployeeQR"),
  [
    body("qrCode")
      .notEmpty()
      .withMessage("ID card QR code is required")
      .isString()
      .trim()
      .isLength({ min: 4, max: 128 }),
    body("location.lat")
      .optional({ nullable: true })
      .isFloat({ min: -90, max: 90 }),
    body("location.lng")
      .optional({ nullable: true })
      .isFloat({ min: -180, max: 180 }),
  ],
  validate,
  scanStaticQR,
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/employee-attendance/manual
// Admin manually marks attendance
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/manual",
  authGuard,
  roleGuard("admin"),
  [
    body("teacherId").notEmpty().isMongoId().withMessage("Invalid teacherId"),
    body("status")
      .notEmpty()
      .isIn(["Present", "Absent", "Late", "Half Day", "Leave", "Holiday"]),
    body("attendanceDate")
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/),
    body("checkInTime").optional({ nullable: true }).isISO8601(),
    body("checkOutTime").optional({ nullable: true }).isISO8601(),
    body("remarks").optional().isString().trim().isLength({ max: 500 }),
  ],
  validate,
  manualMark,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employee-attendance/summary?date=
// Admin: all employees for a day
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/summary",
  authGuard,
  roleGuard("admin"),
  [
    query("date")
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("date must be YYYY-MM-DD"),
  ],
  validate,
  getDailySummary,
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employee-attendance/:teacherId/history
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/:teacherId/history",
  authGuard,
  roleGuard("admin", "teacher"),
  [
    param("teacherId").isMongoId(),
    query("startDate")
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/),
    query("endDate")
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  getEmployeeHistory,
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/employee-attendance/:recordId
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  "/:recordId",
  authGuard,
  roleGuard("admin"),
  [param("recordId").isMongoId()],
  validate,
  deleteRecord,
);

module.exports = router;


//----------------------End of new code-------------------------//