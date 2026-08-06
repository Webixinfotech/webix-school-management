const { body, query } = require("express-validator");

/**
 * Validation rules for creating a student
 */
exports.createStudentValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),
  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),
  body("parent").custom((value, { req }) => {
    const parentData = typeof value === "string" ? JSON.parse(value) : value;

    if (!parentData.primaryName || !parentData.primaryName.trim()) {
      throw new Error("Parent primary name is required");
    }
    if (!parentData.primaryEmail || !parentData.primaryEmail.trim()) {
      throw new Error("Parent primary email is required");
    }
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        parentData.primaryEmail,
      )
    ) {
      throw new Error("Parent primary email is not valid");
    }
    if (!parentData.primaryPhone || !parentData.primaryPhone.trim()) {
      throw new Error("Parent primary phone is required");
    }
    if (!/^[6-9]\d{9}$/.test(parentData.primaryPhone)) {
      throw new Error(
        "Parent primary phone must be a valid 10-digit Indian number",
      );
    }
    if (!parentData.password || parentData.password.length < 6) {
      throw new Error("Parent password must be at least 6 characters");
    }

    // Store parsed data back to req.body for controller
    req.body.parent = parentData;
    return true;
  }),
  body("address").custom((value, { req }) => {
    const addressData = typeof value === "string" ? JSON.parse(value) : value;
    req.body.address = addressData;
    return true;
  }),
];

/**
 * Validation rules for updating a student
 */
exports.updateStudentValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),
  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Graduated", "Transferred"])
    .withMessage("Status must be Active, Inactive, Graduated, or Transferred"),
  body("admissionYear")
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage("Admission year must be a valid year"),
];

/**
 * Validation rules for querying students
 */
exports.getStudentsValidation = [
  query("status")
    .optional()
    .isIn(["Active", "Inactive", "Graduated", "Transferred"])
    .withMessage("Status must be Active, Inactive, Graduated, or Transferred"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 2000 })
    .withMessage("Limit must be between 1 and 2000"),
];
