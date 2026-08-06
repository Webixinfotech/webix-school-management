const express = require("express");
const router = express.Router();

// Import multer configuration
const {
  uploadSinglePhoto,
  uploadBulkPhotos,
  handleMulterError,
} = require("../../config/multer");

// Import controller
const {
  uploadSinglePhoto: uploadSinglePhotoController,
  uploadBulkPhotos: uploadBulkPhotosController,
  getPhotos,
  getPhoto,
  getPendingPhotos,
  approvePhoto,
  rejectPhoto,
  softDeletePhoto,
  hardDeletePhoto,
  restorePhoto,
  getDeletedPhotos,
  likePhoto,
  downloadPhoto,
  updatePhoto,
  bulkDeletePhotos,
  bulkDownloadZip,
  getPhotoStats,
  getMyPhotos,
  parentBulkDownload,
  getTargetAudience,
  getWebsitePhotos,
  toggleWebsite,
} = require("./photo.controller");

// Import middleware
const { authGuard, roleGuard, teacherPermissionGuard } = require("../../middleware/auth.middleware");

// ==================== Stats and Special Routes (BEFORE /:id) ====================

// GET /api/photos/public/website - Public photos for website - No Auth
router.get("/public/website", getWebsitePhotos);

// GET /api/photos/stats - Photo statistics - Admin, Sub-admin
router.get("/stats", authGuard, roleGuard("admin"), getPhotoStats);

// GET /api/photos/pending - Pending photos for approval - Admin, Sub-admin
router.get(
  "/pending",
  authGuard,
  roleGuard("admin"),
  getPendingPhotos,
);

// GET /api/photos/deleted - Deleted photos - Admin only
router.get("/deleted", authGuard, roleGuard("admin"), getDeletedPhotos);

// GET /api/photos/my - Teacher's own photos - Teacher only
router.get("/my", authGuard, roleGuard("teacher"), getMyPhotos);

// GET /api/photos/target-audience - Target audience for teacher upload - Teacher, Admin
router.get(
  "/target-audience",
  authGuard,
  roleGuard("teacher", "admin"),
  getTargetAudience,
);

// ==================== Bulk Operations ====================

// POST /api/photos/bulk/delete - Bulk delete photos - Admin only
router.post("/bulk/delete", authGuard, roleGuard("admin"), bulkDeletePhotos);

// POST /api/photos/bulk/download - Bulk download as ZIP - Admin only
router.post("/bulk/download", authGuard, roleGuard("admin"), bulkDownloadZip);

// POST /api/photos/parent-bulk-download - Parent bulk download selected photos - Parent only
router.post(
  "/parent-bulk-download",
  authGuard,
  roleGuard("parent"),
  parentBulkDownload,
);

// ==================== Upload Routes ====================

// POST /api/photos/upload/single - Upload single photo - Admin, Sub-admin, teacher with canUploadPhotos
// SECURITY FIX: previously roleGuard('admin','teacher') let ANY
// teacher upload regardless of the canUploadPhotos toggle — the toggle only
// hid the "Photos" nav link on the frontend. Now actually enforced.
router.post(
  "/upload/single",
  authGuard,
  teacherPermissionGuard("canUploadPhotos"),
  uploadSinglePhoto,
  handleMulterError,
  uploadSinglePhotoController,
);

// POST /api/photos/upload/bulk - Upload bulk photos - Admin, Sub-admin, teacher with canUploadPhotos
router.post(
  "/upload/bulk",
  authGuard,
  teacherPermissionGuard("canUploadPhotos"),
  uploadBulkPhotos,
  handleMulterError,
  uploadBulkPhotosController,
);

// ==================== General Routes ====================

// GET /api/photos - Get all photos (filtered by role) - All roles
router.get("/", authGuard, getPhotos);

// GET /api/photos/:id - Get single photo by ID - All roles
router.get("/:id", authGuard, getPhoto);

// ==================== Actions on Specific Photo ====================

// POST /api/photos/:id/approve - Approve photo - Admin, Sub-admin
router.post(
  "/:id/approve",
  authGuard,
  roleGuard("admin"),
  approvePhoto,
);

// POST /api/photos/:id/toggle-website - Toggle website visibility - Admin, Sub-admin
router.post(
  "/:id/toggle-website",
  authGuard,
  roleGuard("admin"),
  toggleWebsite,
);

// POST /api/photos/:id/reject - Reject photo - Admin, Sub-admin
router.post(
  "/:id/reject",
  authGuard,
  roleGuard("admin"),
  rejectPhoto,
);

// POST /api/photos/:id/restore - Restore deleted photo - Admin only
router.post("/:id/restore", authGuard, roleGuard("admin"), restorePhoto);

// POST /api/photos/:id/like - Like/Unlike photo - Parent only
router.post("/:id/like", authGuard, roleGuard("parent"), likePhoto);

// GET /api/photos/:id/download - Download photo - Admin, Parent
router.get(
  "/:id/download",
  authGuard,
  roleGuard("admin", "parent"),
  downloadPhoto,
);

// POST /api/photos/:id/soft-delete - Soft delete photo - Admin, Sub-admin, Teacher (own only)
router.post(
  "/:id/soft-delete",
  authGuard,
  roleGuard("admin", "teacher"),
  softDeletePhoto,
);

// DELETE /api/photos/:id/hard-delete - Hard delete photo - Admin only
router.delete(
  "/:id/hard-delete",
  authGuard,
  roleGuard("admin"),
  hardDeletePhoto,
);

// PUT /api/photos/:id - Update photo details - Admin, Sub-admin, Teacher (own pending only)
router.put(
  "/:id",
  authGuard,
  roleGuard("admin", "teacher"),
  updatePhoto,
);

module.exports = router;