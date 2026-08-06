const { query } = require("express-validator");

/**
 * Validation rules for admin student queries
 * Future-proof: Supports all filtering options
 */
exports.adminGetStudentsValidation = [
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term cannot exceed 100 characters"),

  query("status")
    .optional()
    .isIn(["Active", "Inactive", "Graduated", "Transferred"])
    .withMessage("Status must be Active, Inactive, Graduated, or Transferred"),

  query("className")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Class name cannot exceed 50 characters"),

  query("section")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Section cannot exceed 20 characters"),

  query("classIds")
    .optional()
    .isJSON()
    .withMessage("classIds must be a JSON array of class IDs"),

  query("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),

  query("admissionYear")
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage("Admission year must be a valid year"),

  query("admissionAY")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Admission AY cannot exceed 20 characters"),

  query("bloodGroup")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])
    .withMessage("Invalid blood group"),

  query("hasParent")
    .optional()
    .isBoolean()
    .withMessage("hasParent must be true or false"),

  query("hasPhoto")
    .optional()
    .isBoolean()
    .withMessage("hasPhoto must be true or false"),

  query("isReferred")
    .optional()
    .isBoolean()
    .withMessage("isReferred must be true or false"),

  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("dateFrom must be a valid ISO date (YYYY-MM-DD)"),

  query("dateTo")
    .optional()
    .isISO8601()
    .withMessage("dateTo must be a valid ISO date (YYYY-MM-DD)"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("Limit must be between 1 and 500 (admin override allowed)"),

  query("sortBy")
    .optional()
    .isIn([
      "firstName",
      "lastName",
      "admissionNo",
      "admissionDate",
      "className",
      "section",
      "status",
      "createdAt",
      "parentDetails.primaryName",
    ])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),

  query("fields")
    .optional()
    .matches(/^[a-zA-Z,]+$/)
    .withMessage("Fields must be comma-separated field names"),

  query("include")
    .optional()
    .matches(/^[a-zA-Z,]+$/)
    .withMessage("Include must be comma-separated relation names"),
];
