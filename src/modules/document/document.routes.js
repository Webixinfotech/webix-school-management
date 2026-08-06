/**
 * Document Routes
 *
 * Mounts at: /api/documents
 *
 * RBAC Summary:
 *   admin / sub-admin → full access (all 3 docTypes)
 *   teacher           → achievement certificates only (enforced in controller)
 *   parent            → read-only access to documents assigned to them
 */

const express = require("express");
const router = express.Router();

const { authGuard, roleGuard, teacherPermissionGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

const {
  uploadSignature,
  getMySignature,
  getPrefillData,
  createDocument,
  updateDocument,
  getMyDocuments,
  listMyIssuedDocuments,
  getDocumentById,
} = require("./document.controller");

const {
  createDocumentValidation,
  updateDocumentValidation,
} = require("./document.validators");

// All routes require authentication
router.use(authGuard);

// ─── Signature (reusable, one per user) ──────────────────────────────────────

router.post("/signature", uploadSignature);
router.get("/signature", getMySignature);

// ─── Prefill (admin / sub-admin / teacher) ───────────────────────────────────
// teacherPermissionGuard('canManageCertificates') is chained after roleGuard
// so admin/sub-admin access is unaffected (they already pass roleGuard, and
// teacherPermissionGuard also auto-allows them); only the teacher role is
// actually gated by the permission flag.

router.get(
  "/prefill",
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canManageCertificates"),
  getPrefillData
);

// ─── Create / Update ──────────────────────────────────────────────────────────

router.post(
  "/",
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canManageCertificates"),
  createDocumentValidation,
  validate,
  createDocument
);
router.put(
  "/:id",
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canManageCertificates"),
  updateDocumentValidation,
  validate,
  updateDocument
);

// ─── Listing ──────────────────────────────────────────────────────────────────

// "My Documents" — assigned to the current user (teacher / parent / admin).
// NOT gated by canManageCertificates: this is "documents shared with me",
// a different feature from the Certificates/CertificateStudio nav item.
router.get("/my-documents", getMyDocuments);

// Documents the current admin/teacher has issued (management/history view)
router.get(
  "/issued-by-me",
  roleGuard("admin", "teacher"),
  teacherPermissionGuard("canManageCertificates"),
  listMyIssuedDocuments
);

// ─── Single document detail (must be last — ":id" is a wildcard) ────────────

router.get("/:id", getDocumentById);

module.exports = router;