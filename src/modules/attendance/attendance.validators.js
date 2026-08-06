const { body, param, query } = require("express-validator");
const {
  ATTENDANCE_STATUSES,
  ATTENDANCE_METHODS,
  ATTENDANCE_SESSIONS,
} = require("./attendance.model");

exports.scanAttendanceValidation = [
  body("qrCode").trim().notEmpty().withMessage("QR code is required"),
  body("attendanceDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Attendance date must be a valid ISO date"),
  body("sessionLabel")
    .optional()
    .isIn(ATTENDANCE_SESSIONS)
    .withMessage(
      `Session label must be one of: ${ATTENDANCE_SESSIONS.join(", ")}`,
    ),
  body("checkInTime")
    .optional({ values: "falsy", nullable: true })
    .isISO8601()
    .withMessage("Check-in time must be a valid ISO date"),
  body("checkOutTime")
    .optional({ values: "falsy", nullable: true })
    .isISO8601()
    .withMessage("Check-out time must be a valid ISO date"),
];

exports.manualAttendanceValidation = [
  body("studentId")
    .trim()
    .notEmpty()
    .withMessage("Student ID or admission number is required"),
  body("attendanceDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Attendance date must be a valid ISO date"),
  body("status")
    .notEmpty()
    .withMessage("Attendance status is required")
    .isIn(ATTENDANCE_STATUSES)
    .withMessage(`Status must be one of: ${ATTENDANCE_STATUSES.join(", ")}`),
  body("sessionLabel")
    .optional()
    .isIn(ATTENDANCE_SESSIONS)
    .withMessage(
      `Session label must be one of: ${ATTENDANCE_SESSIONS.join(", ")}`,
    ),
  body("method")
    .optional()
    .isIn(ATTENDANCE_METHODS)
    .withMessage(`Method must be one of: ${ATTENDANCE_METHODS.join(", ")}`),
  body("remarks")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  body("checkInTime")
    .optional({ values: "falsy", nullable: true })
    .isISO8601()
    .withMessage("Check-in time must be a valid ISO date"),
  body("checkOutTime")
    .optional({ values: "falsy", nullable: true })
    .isISO8601()
    .withMessage("Check-out time must be a valid ISO date"),
];

exports.updateAttendanceValidation = [
  param("id").notEmpty().withMessage("Attendance ID is required"),
  body("attendanceDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Attendance date must be a valid ISO date"),
  body("status")
    .optional()
    .isIn(ATTENDANCE_STATUSES)
    .withMessage(`Status must be one of: ${ATTENDANCE_STATUSES.join(", ")}`),
  body("sessionLabel")
    .optional()
    .isIn(ATTENDANCE_SESSIONS)
    .withMessage(
      `Session label must be one of: ${ATTENDANCE_SESSIONS.join(", ")}`,
    ),
  body("method")
    .optional()
    .isIn(ATTENDANCE_METHODS)
    .withMessage(`Method must be one of: ${ATTENDANCE_METHODS.join(", ")}`),
  body("remarks")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  body("checkInTime")
    .optional({ values: "falsy", nullable: true })
    .isISO8601()
    .withMessage("Check-in time must be a valid ISO date"),
  body("checkOutTime")
    .optional({ values: "falsy", nullable: true })
    .isISO8601()
    .withMessage("Check-out time must be a valid ISO date"),
  body("note")
    .optional({ values: "falsy" })
    .isLength({ max: 500 })
    .withMessage("Edit note cannot exceed 500 characters"),
];

exports.getAttendanceListValidation = [
  query("date")
    .optional({ values: "falsy" })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format"),
  query("dateFrom")
    .optional({ values: "falsy" })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date from must be in YYYY-MM-DD format"),
  query("dateTo")
    .optional({ values: "falsy" })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date to must be in YYYY-MM-DD format"),
  query("status")
    .optional({ values: "falsy" })
    .isIn(ATTENDANCE_STATUSES)
    .withMessage(`Status must be one of: ${ATTENDANCE_STATUSES.join(", ")}`),
  query("sessionLabel")
    .optional({ values: "falsy" })
    .isIn(ATTENDANCE_SESSIONS)
    .withMessage(
      `Session label must be one of: ${ATTENDANCE_SESSIONS.join(", ")}`,
    ),
  query("sessionId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Session ID must be a valid ID"),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

exports.getStudentAttendanceValidation = [
  param("id")
    .notEmpty()
    .withMessage("Student ID or admission number is required"),
  query("dateFrom")
    .optional({ values: "falsy" })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date from must be in YYYY-MM-DD format"),
  query("dateTo")
    .optional({ values: "falsy" })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date to must be in YYYY-MM-DD format"),
];

exports.getDailySummaryValidation = [
  query("date")
    .optional({ values: "falsy" })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format"),
];

exports.centerSessionValidation = [
  body().custom((value, { req }) => {
    if (!req.body.qrCode && !req.body.studentId) {
      throw new Error("Either qrCode or studentId is required");
    }
    return true;
  }),
];