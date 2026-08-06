const express = require("express");
const router = express.Router();

// Import controller
const {
  submitEnquiry,
  submitEnquiryStep1,
  submitEnquiryStep2,
  submitEnquiryStep3,
  submitEnquiryStep4,
  getEnquiries,
  getEnquiry,
  updateEnquiryStatus,
  convertToStudent,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
} = require("./enquiry.controller");

// Import validators
const {
  submitStep1Validation,
  submitStep2Validation,
  submitStep3Validation,
  submitStep4Validation,
  updateEnquiryStatusValidation,
  convertToStudentValidation,
  updateEnquiryValidation,
  getEnquiriesValidation,
} = require("./enquiry.validators");

// Import middleware
const { authGuard, roleGuard, teacherPermissionGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

// ═══════════════════════════════════════════════════════
// STEP-BY-STEP PUBLIC ROUTES (Recommended for frontend)
// ═══════════════════════════════════════════════════════

// Step 1: Save mobile + services (creates enquiry)
router.post("/step-1", submitStep1Validation, validate, submitEnquiryStep1);

// Step 2: Save child/job information
router.put("/step-2/:id", submitStep2Validation, validate, submitEnquiryStep2);

// Step 3: Save parent details
router.put("/step-3/:id", submitStep3Validation, validate, submitEnquiryStep3);

// Step 4: Save visit details + finalize
router.put("/step-4/:id", submitStep4Validation, validate, submitEnquiryStep4);

// ═══════════════════════════════════════════════════════
// OLD SINGLE-SUBMIT ROUTE (Deprecated but still works)
// ═══════════════════════════════════════════════════════
router.post("/", submitEnquiry);

// ═══════════════════════════════════════════════════════
// ADMIN ROUTES (Require authentication)
// ═══════════════════════════════════════════════════════

// Stats route MUST be before /:id route
router.get(
  "/stats",
  authGuard,
  teacherPermissionGuard("canManageEnquiries"),
  getEnquiryStats,
);

// GET /api/enquiries - Admin, Sub-admin, teacher with canManageEnquiries
router.get(
  "/",
  authGuard,
  teacherPermissionGuard("canManageEnquiries"),
  getEnquiriesValidation,
  validate,
  getEnquiries,
);

// GET /api/enquiries/:id - Admin, Sub-admin, teacher with canManageEnquiries
router.get("/:id", authGuard, teacherPermissionGuard("canManageEnquiries"), getEnquiry);

// PUT /api/enquiries/:id - Admin, Sub-admin, teacher with canManageEnquiries
router.put(
  "/:id",
  authGuard,
  teacherPermissionGuard("canManageEnquiries"),
  updateEnquiryValidation,
  validate,
  updateEnquiry,
);

// PUT /api/enquiries/:id/status - Admin, Sub-admin, teacher with canManageEnquiries
router.put(
  "/:id/status",
  authGuard,
  teacherPermissionGuard("canManageEnquiries"),
  updateEnquiryStatusValidation,
  validate,
  updateEnquiryStatus,
);

// POST /api/enquiries/:id/convert - Admin, or teacher with canManageEnquiries.
// allowSubAdmin: false — this previously excluded sub-admin too
// (roleGuard('admin') only); adding teacher access doesn't change that.
// Converting an enquiry creates real Student + Parent + User records, so
// double-check this elevation is really wanted before shipping it.
router.post(
  "/:id/convert",
  authGuard,
  teacherPermissionGuard("canManageEnquiries"),
  convertToStudentValidation,
  validate,
  convertToStudent,
);

// DELETE /api/enquiries/:id - Admin only (unchanged — permanent delete
// stays out of scope for canManageEnquiries)
router.delete("/:id", authGuard, roleGuard("admin"), deleteEnquiry);

module.exports = router;