/**
 * ID Card Routes
 *
 * Mounts at: /api/id-cards
 *
 * RBAC Summary (actual roles in this system: admin, teacher, parent — there is no sub-admin role):
 *   admin   → full access to everything (templates, student/staff cards, bulk, export logs)
 *   teacher → student ID cards only, and only for students in a class the teacher
 *             is assigned to (enforced via assertTeacherCanAccessStudent in idCard.service.js)
 *   parent  → own child's ID card only (enforced via parentUserId check in the controller)
 */

const express = require("express");
const router = express.Router();

const {
  authGuard,
  roleGuard,
} = require("../../middleware/auth.middleware");

const {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getStudentIdCardData,
  getStaffIdCardData,
  downloadStudentIdCard,
  downloadStaffIdCard,
  bulkStudentIdCards,
  bulkStaffIdCards,
  getStudentQR,
  getStaffQR,
  getExportLogs,
  parentViewChildIdCard,
  parentDownloadChildIdCard,
  previewTemplate,
  downloadStudentA4Sheet,
  downloadStaffA4Sheet,
} = require("./idCard.controller");

// All routes require authentication
router.use(authGuard);

// ─── TEMPLATE MANAGEMENT (admin only) ────────────────────────────────────────

router.get("/templates", roleGuard("admin"), listTemplates);
router.post("/templates", roleGuard("admin"), createTemplate);
router.put("/templates/:id", roleGuard("admin"), updateTemplate);
router.delete("/templates/:id", roleGuard("admin"), deleteTemplate);

router.post(
  "/templates/preview",
  roleGuard("admin"),
  previewTemplate,
);

// ─── EXPORT LOGS (admin only) ─────────────────────────────────────────────────

router.get("/export-logs", roleGuard("admin"), getExportLogs);

// ─── PARENT ROUTES — own child only ──────────────────────────────────────────

router.get("/my-child/:studentId", roleGuard("parent"), parentViewChildIdCard);
router.get(
  "/my-child/:studentId/download",
  roleGuard("parent"),
  parentDownloadChildIdCard,
);

// ─── STUDENT ID CARD (admin / teacher) ───────────────────────────────────────

/**
 * GET /api/id-cards/student/:id
 * Preview/data payload for student ID card.
 * admin: always allowed
 * teacher: allowed only if assigned to the student's class (checked in controller)
 */
router.get(
  "/student/:id",
  roleGuard("admin", "teacher"),
  getStudentIdCardData,
);

/**
 * GET /api/id-cards/student/:id/download?templateId=xxx
 * PDF download for single student ID card.
 */
router.get(
  "/student/:id/download",
  roleGuard("admin", "teacher"),
  downloadStudentIdCard,
);

/**
 * GET /api/id-cards/student/:id/qr
 * Standalone QR code for a student.
 */
router.get(
  "/student/:id/qr",
  roleGuard("admin", "teacher"),
  getStudentQR,
);

/**
 * POST /api/id-cards/student/bulk
 * Bulk PDF generation for students.
 * Body: { className?, section?, session?, studentIds[]?, templateId? }
 */
router.post(
  "/student/bulk",
  roleGuard("admin"),
  bulkStudentIdCards,
);

// ─── STAFF ID CARD (admin only) ──────────────────────────────────────────────

/**
 * GET /api/id-cards/staff/:id
 * Preview/data payload for staff ID card.
 * Teachers are NOT allowed to view staff ID cards.
 */
router.get("/staff/:id", roleGuard("admin"), getStaffIdCardData);

/**
 * GET /api/id-cards/staff/:id/download?templateId=xxx
 */
router.get(
  "/staff/:id/download",
  roleGuard("admin"),
  downloadStaffIdCard,
);

/**
 * GET /api/id-cards/staff/:id/qr
 */
router.get("/staff/:id/qr", roleGuard("admin"), getStaffQR);

/**
 * POST /api/id-cards/staff/bulk
 * Body: { teacherIds[]?, templateId? }
 */
router.post("/staff/bulk", roleGuard("admin"), bulkStaffIdCards);

// ─── A4 SHEET PRINTING (admin only) ──────────────────────────────────────────

/**
 * POST /api/id-cards/student/a4-sheet
 * Generate A4 print sheet for student ID cards (10 per page with crop marks).
 * Body: { className?, section?, session?, studentIds[]?, templateId? }
 */
router.post(
  "/student/a4-sheet",
  roleGuard("admin"),
  downloadStudentA4Sheet
);

/**
 * POST /api/id-cards/staff/a4-sheet
 * Generate A4 print sheet for staff ID cards (9 per page with crop marks).
 * Body: { teacherIds[]?, templateId? }
 */
router.post(
  "/staff/a4-sheet",
  roleGuard("admin"),
  downloadStaffA4Sheet
);

module.exports = router;
