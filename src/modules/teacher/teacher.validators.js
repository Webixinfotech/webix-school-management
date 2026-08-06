const { body } = require("express-validator");

/**
 * Validation rules for creating a teacher
 */
exports.createTeacherValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Teacher name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian phone number"),
  body("dateOfJoining").notEmpty().withMessage("Date of joining is required"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive", "On Leave"])
    .withMessage("Status must be Active, Inactive, or On Leave"),
];

/**
 * Validation rules for updating a teacher
 */
exports.updateTeacherValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian phone number"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive", "On Leave"])
    .withMessage("Status must be Active, Inactive, or On Leave"),
];

/**
 * Validation rules for adding an admin note
 */
exports.addAdminNoteValidation = [
  body("note").trim().notEmpty().withMessage("Note content is required"),
  body("visibleToSubAdmin")
    .optional()
    .isBoolean()
    .withMessage("visibleToSubAdmin must be a boolean"),
];

/**
 * Validation rules for updating an admin note
 */
exports.updateAdminNoteValidation = [
  body("note")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Note content cannot be empty"),
  body("visibleToSubAdmin")
    .optional()
    .isBoolean()
    .withMessage("visibleToSubAdmin must be a boolean"),
];
