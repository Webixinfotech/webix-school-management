const { body, param, query } = require("express-validator");

// ─── Valid enum values (mirrors the model) ────────────────────────────────────

const SLEEP_QUALITIES = [
  "slept_well",
  "slept_little",
  "did_not_sleep",
  "napped",
];
const FOOD_TIMES = ["morning", "midday", "afternoon", "evening"];
const FOOD_QUANTITIES = [
  "ate_well",
  "ate_little",
  "did_not_eat",
  "ate_everything",
];
const DIAPER_STATUSES = ["changed", "not_required", "na"];
const DIAPER_TIMES = ["morning", "midday", "afternoon", "multiple"];
const MOODS = ["happy", "calm", "cranky", "sad", "unwell"];

// ─── Upsert Activity ──────────────────────────────────────────────────────────

exports.upsertActivityValidation = [
  body("studentId")
    .notEmpty()
    .withMessage("studentId is required")
    .isMongoId()
    .withMessage("Invalid studentId"),

  body("classId")
    .notEmpty()
    .withMessage("classId is required")
    .isMongoId()
    .withMessage("Invalid classId"),

  body("activityDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("activityDate must be YYYY-MM-DD"),

  // Sleep
  body("sleep.quality")
    .optional({ nullable: true })
    .isIn(SLEEP_QUALITIES)
    .withMessage(`sleep.quality must be one of: ${SLEEP_QUALITIES.join(", ")}`),

  // Food
  body("food.time")
    .optional({ nullable: true })
    .isIn(FOOD_TIMES)
    .withMessage(`food.time must be one of: ${FOOD_TIMES.join(", ")}`),

  body("food.quantity")
    .optional({ nullable: true })
    .isIn(FOOD_QUANTITIES)
    .withMessage(`food.quantity must be one of: ${FOOD_QUANTITIES.join(", ")}`),

  body("food.note")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("food.note cannot exceed 200 characters"),

  // Diaper
  body("diaper.status")
    .optional({ nullable: true })
    .isIn(DIAPER_STATUSES)
    .withMessage(`diaper.status must be one of: ${DIAPER_STATUSES.join(", ")}`),

  body("diaper.changeTime")
    .optional({ nullable: true })
    .isIn(DIAPER_TIMES)
    .withMessage(
      `diaper.changeTime must be one of: ${DIAPER_TIMES.join(", ")}`,
    ),

  // Mood
  body("mood")
    .optional({ nullable: true })
    .isIn(MOODS)
    .withMessage(`mood must be one of: ${MOODS.join(", ")}`),

  // Activities (array of strings)
  body("activities")
    .optional()
    .isArray()
    .withMessage("activities must be an array"),

  body("activities.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Each activity label cannot exceed 100 characters"),

  // Health concerns (array of strings)
  body("healthConcerns")
    .optional()
    .isArray()
    .withMessage("healthConcerns must be an array"),

  body("healthConcerns.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Each health concern label cannot exceed 100 characters"),

  // Teacher note
  body("teacherNote")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("teacherNote cannot exceed 1000 characters"),
];

// ─── Get Student Activity ─────────────────────────────────────────────────────

exports.getStudentActivityValidation = [
  param("studentId")
    .notEmpty()
    .withMessage("studentId is required")
    .isMongoId()
    .withMessage("Invalid studentId"),

  query("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be YYYY-MM-DD"),
];

// ─── Get Class Activities ─────────────────────────────────────────────────────

exports.getClassActivitiesValidation = [
  param("classId")
    .notEmpty()
    .withMessage("classId is required")
    .isMongoId()
    .withMessage("Invalid classId"),

  query("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be YYYY-MM-DD"),
];

// ─── Get Student History ──────────────────────────────────────────────────────

exports.getStudentHistoryValidation = [
  param("studentId")
    .notEmpty()
    .withMessage("studentId is required")
    .isMongoId()
    .withMessage("Invalid studentId"),

  query("startDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("startDate must be YYYY-MM-DD"),

  query("endDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("endDate must be YYYY-MM-DD"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

// ─── Get Teacher History ──────────────────────────────────────────────────────

exports.getTeacherHistoryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),

  query("studentId").optional().isMongoId().withMessage("Invalid student ID format"),

  query("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be in YYYY-MM-DD format"),
];

// ─── Get All History (Admin) ──────────────────────────────────────────────────

exports.getAllHistoryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage("limit must be between 1 and 200"),

  query("studentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid student ID format"),

  query("classId").optional().isMongoId().withMessage("Invalid class ID format"),

  query("teacherId")
    .optional()
    .isMongoId()
    .withMessage("Invalid teacher ID format"),

  query("startDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("startDate must be YYYY-MM-DD"),

  query("endDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("endDate must be YYYY-MM-DD"),

  query("sortBy").optional().isString().trim(),

  query("sortOrder").optional().isIn(["asc", "desc"]),
];

// ─── Get Daily Summary ────────────────────────────────────────────────────────

exports.getDailySummaryValidation = [
  query("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be YYYY-MM-DD"),
];

// ─── Delete Activity ──────────────────────────────────────────────────────────

exports.deleteActivityValidation = [
  param("activityId")
    .notEmpty()
    .withMessage("activityId is required")
    .isMongoId()
    .withMessage("Invalid activityId"),
];
