const { param } = require("express-validator");

/**
 * Validation rules for getting student referral info
 */
exports.getStudentReferralInfoValidation = [
  param("studentId").notEmpty().withMessage("Student ID is required"),
];

/**
 * Validation rules for getting referrer profile
 */
exports.getReferrerProfileValidation = [
  param("parentId").notEmpty().withMessage("Parent ID is required"),
];
