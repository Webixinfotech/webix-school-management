const { body, param, query } = require("express-validator");

/**
 * Validation rules for Step 1 (mobile + services)
 */
exports.submitStep1Validation = [
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^\d{10}$/)
    .withMessage("Mobile number must be a valid 10-digit number"),
  body("services")
    .isArray({ min: 1 })
    .withMessage("Please select at least one service"),
];

/**
 * Validation rules for Step 2 (child/job information)
 */
exports.submitStep2Validation = [
  param("id").notEmpty().withMessage("Enquiry ID is required"),
  body("childName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Child name is required when type is child or both"),
  body("applicantName").optional().trim(),
  body("position").optional().trim(),
  body("qualification").optional().trim(),
];

/**
 * Validation rules for Step 3 (parent details)
 */
exports.submitStep3Validation = [
  param("id").notEmpty().withMessage("Enquiry ID is required"),
  body("fatherName").trim().notEmpty().withMessage("Father name is required"),
  body("fatherMobile")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Father mobile must be a valid 10-digit number"),
  body("motherName").optional().trim(),
  body("motherMobile")
    .optional({ values: "falsy" })
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Mother mobile must be a valid 10-digit number"),
  body("fatherEmail").optional({ values: "falsy" }).trim(),
  body("motherEmail").optional({ values: "falsy" }).trim(),
];

/**
 * Validation rules for Step 4 (visit details)
 */
exports.submitStep4Validation = [
  param("id").notEmpty().withMessage("Enquiry ID is required"),
  body("visitPreference")
    .optional()
    .isIn(["visit", "callback"])
    .withMessage("Visit preference must be either visit or callback"),
  body("preferredTime")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Preferred time must be an array with at least one time slot"),
  body("callbackPreferredTime")
    .optional()
    .isArray({ min: 1 })
    .withMessage(
      "Callback preferred time must be an array with at least one time slot",
    ),
];

/**
 * Validation rules for updating enquiry status
 */
exports.updateEnquiryStatusValidation = [
  param("id").notEmpty().withMessage("Enquiry ID is required"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["New", "Contacted", "Visited", "Admitted", "Rejected"])
    .withMessage(
      "Status must be New, Contacted, Visited, Admitted, or Rejected",
    ),
];

/**
 * Validation rules for converting enquiry to student
 */
exports.convertToStudentValidation = [
  param("id").notEmpty().withMessage("Enquiry ID is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("className").optional().trim(),
  body("section").optional().trim(),
  body("rollNo").optional().trim(),
];

/**
 * Validation rules for updating enquiry
 */
exports.updateEnquiryValidation = [
  param("id").notEmpty().withMessage("Enquiry ID is required"),
  body("mobile")
    .optional()
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Mobile number must be a valid 10-digit number"),
  body("services")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Services must be an array with at least one item"),
  body("visitPreference")
    .optional()
    .isIn(["visit", "callback"])
    .withMessage("Visit preference must be either visit or callback"),
  body("preferredTime")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Preferred time must be an array with at least one time slot"),
  body("callbackPreferredTime")
    .optional()
    .isArray({ min: 1 })
    .withMessage(
      "Callback preferred time must be an array with at least one time slot",
    ),
  body("fatherEmail").optional({ values: "falsy" }).trim(),
  body("motherEmail").optional({ values: "falsy" }).trim(),
];

/**
 * Validation rules for querying enquiries
 */
exports.getEnquiriesValidation = [
  query("status")
    .optional()
    .isIn(["New", "Contacted", "Visited", "Admitted", "Rejected"])
    .withMessage(
      "Status must be New, Contacted, Visited, Admitted, or Rejected",
    ),
  query("type")
    .optional()
    .isIn(["child", "job", "both", "course"])
    .withMessage("Type must be child, job, both, or course"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 2000 })
    .withMessage("Limit must be between 1 and 2000"),
];
