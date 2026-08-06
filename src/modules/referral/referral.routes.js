const express = require("express");
const router = express.Router();

const {
  checkMobile,
  createManualReferral,
  submitLinkReferral,
  getMyReferrals,
  getMyReferralStats,
  getAllReferrals,
  getReferral,
  updateReferralStatus,
  getReferralStats,
  validateReferralCode,
} = require("./referral.controller");

const {
  checkMobileValidation,
  createManualReferralValidation,
  submitLinkReferralValidation,
  updateReferralStatusValidation,
  getReferralValidation,
  getReferralsQueryValidation,
} = require("./referral.validators");

const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

// ============================================================================
// PUBLIC routes (no auth required)
// ============================================================================

// POST /api/referrals/link - Submit link referral
router.post(
  "/link",
  submitLinkReferralValidation,
  validate,
  submitLinkReferral,
);

// GET /api/referrals/validate/:code - Validate referral code
router.get("/validate/:code", validateReferralCode);

// ============================================================================
// Parent only routes (require auth + parent role)
// IMPORTANT: /my/stats and /my must be before any :id routes
// ============================================================================

// POST /api/referrals/check-mobile - Check if mobile is available
router.post(
  "/check-mobile",
  authGuard,
  roleGuard("parent"),
  checkMobileValidation,
  validate,
  checkMobile,
);

// POST /api/referrals/manual - Create manual referral
router.post(
  "/manual",
  authGuard,
  roleGuard("parent"),
  createManualReferralValidation,
  validate,
  createManualReferral,
);

// GET /api/referrals/my/stats - Get my referral stats
router.get("/my/stats", authGuard, roleGuard("parent"), getMyReferralStats);

// GET /api/referrals/my - Get my referrals
router.get("/my", authGuard, roleGuard("parent"), getMyReferrals);

// ============================================================================
// Admin/Sub-admin routes (require auth + admin/sub-admin role)
// IMPORTANT: /stats must be before /:id
// ============================================================================

// GET /api/referrals/stats - Get referral stats
router.get(
  "/stats",
  authGuard,
  roleGuard("admin"),
  getReferralStats,
);

// GET /api/referrals - Get all referrals
router.get(
  "/",
  authGuard,
  roleGuard("admin"),
  getReferralsQueryValidation,
  validate,
  getAllReferrals,
);

// GET /api/referrals/:id - Get single referral
router.get(
  "/:id",
  authGuard,
  roleGuard("admin"),
  getReferralValidation,
  validate,
  getReferral,
);

// PUT /api/referrals/:id/status - Update referral status (Admin only)
router.put(
  "/:id/status",
  authGuard,
  roleGuard("admin"),
  updateReferralStatusValidation,
  validate,
  updateReferralStatus,
);

module.exports = router;
