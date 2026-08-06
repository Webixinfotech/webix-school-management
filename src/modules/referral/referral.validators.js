const { body, param, query } = require("express-validator");

/**
 * Validation rules for check-mobile
 */
exports.checkMobileValidation = [
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Mobile number must be a valid 10-digit Indian number"),
];

/**
 * Validation rules for manual referral
 */
exports.createManualReferralValidation = [
  body("friendName")
    .trim()
    .notEmpty()
    .withMessage("Friend name is required")
    .isLength({ max: 100 })
    .withMessage("Friend name cannot exceed 100 characters"),
  body("friendMobile")
    .trim()
    .notEmpty()
    .withMessage("Friend mobile number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Mobile number must be a valid 10-digit Indian number"),
  body("childName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Child name cannot exceed 100 characters"),
];

/**
 * Validation rules for link referral
 */
exports.submitLinkReferralValidation = [
  body("referralCode")
    .trim()
    .notEmpty()
    .withMessage("Referral code is required"),
  body("friendName")
    .trim()
    .notEmpty()
    .withMessage("Friend name is required")
    .isLength({ max: 100 })
    .withMessage("Friend name cannot exceed 100 characters"),
  body("friendMobile")
    .trim()
    .notEmpty()
    .withMessage("Friend mobile number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Mobile number must be a valid 10-digit Indian number"),
  body("childName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Child name cannot exceed 100 characters"),
];

/**
 * Validation rules for update referral status
 */
exports.updateReferralStatusValidation = [
  param("id")
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage("Invalid referral ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "joined", "rewarded", "failed"])
    .withMessage(
      "Invalid status. Must be: pending, joined, rewarded, or failed",
    ),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note cannot exceed 500 characters"),
  body("childName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Child name cannot exceed 100 characters"),
  body("rewardPoints")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Reward points must be a positive integer"),
];

/**
 * Validation rules for get referral by ID
 */
exports.getReferralValidation = [
  param("id")
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage("Invalid referral ID format"),
];

/**
 * Validation rules for query parameters
 */
exports.getReferralsQueryValidation = [
  query("status")
    .optional()
    .isIn(["pending", "joined", "rewarded", "failed"])
    .withMessage(
      "Invalid status. Must be: pending, joined, rewarded, or failed",
    ),
  query("source")
    .optional()
    .isIn(["manual", "link"])
    .withMessage("Invalid source. Must be: manual or link"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];
