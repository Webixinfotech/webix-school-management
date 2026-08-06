const express = require("express");
const router = express.Router();

// Import controller
const {
  getAdminReferralDashboard,
  getMyReferralTracking,
  getStudentReferralInfo,
  getReferrerProfile,
} = require("./referralTracking.controller");

// Import validators
const {
  getStudentReferralInfoValidation,
  getReferrerProfileValidation,
} = require("./referralTracking.validators");

// Import middleware
const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

// All routes require authentication
router.use(authGuard);

// GET /api/referral-tracking/dashboard - Admin, Sub-admin
router.get(
  "/dashboard",
  roleGuard("admin"),
  getAdminReferralDashboard,
);

// GET /api/referral-tracking/my - Parent only
router.get("/my", roleGuard("parent"), getMyReferralTracking);

// GET /api/referral-tracking/student/:studentId - Admin, Sub-admin, Parent (own child only)
router.get(
  "/student/:studentId",
  roleGuard("admin", "parent"),
  getStudentReferralInfoValidation,
  validate,
  getStudentReferralInfo,
);

// GET /api/referral-tracking/referrer/:parentId - Admin, Sub-admin
router.get(
  "/referrer/:parentId",
  roleGuard("admin"),
  getReferrerProfileValidation,
  validate,
  getReferrerProfile,
);

module.exports = router;
