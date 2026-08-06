const express = require("express");
const router = express.Router();

const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const {
  uploadAvatar,
  uploadAvatarBase64,
  deleteAvatar,
  getPresignedUrl,
  updateAvatarUrl,
  deleteFile,
  uploadPhoto,
  uploadBulkPhotos,
} = require("./upload.controller");

const {
  uploadAvatar: uploadAvatarMiddleware,
  uploadSinglePhoto,
  uploadBulkPhotos: uploadBulkMiddleware,
  handleMulterError,
} = require("../../config/multer-s3");

// ==================== Avatar Upload Routes ====================

/**
 * @desc    Upload profile avatar
 * @route   POST /api/upload/avatar
 * @access  Private (all authenticated users)
 */
router.post(
  "/avatar",
  authGuard,
  uploadAvatarMiddleware,
  handleMulterError,
  uploadAvatar,
);

/**
 * @desc    Upload avatar via base64
 * @route   POST /api/upload/avatar/base64
 * @access  Private (all authenticated users)
 */
router.post("/avatar/base64", authGuard, uploadAvatarBase64);

/**
 * @desc    Delete avatar
 * @route   DELETE /api/upload/avatar
 * @access  Private (all authenticated users)
 */
router.delete("/avatar", authGuard, deleteAvatar);

/**
 * @desc    Update avatar URL (after direct S3 upload)
 * @route   PUT /api/upload/avatar/url
 * @access  Private (all authenticated users)
 */
router.put("/avatar/url", authGuard, updateAvatarUrl);

// ==================== Presigned URL Routes ====================

/**
 * @desc    Get presigned URL for direct S3 upload
 * @route   GET /api/upload/presigned-url
 * @access  Private (all authenticated users)
 */
router.get("/presigned-url", authGuard, getPresignedUrl);

// ==================== Photo Upload Routes ====================

/**
 * @desc    Upload single photo to S3
 * @route   POST /api/upload/photo
 * @access  Private (Admin, Sub-admin, Teacher)
 */
router.post(
  "/photo",
  authGuard,
  roleGuard("admin", "teacher"),
  uploadSinglePhoto,
  handleMulterError,
  uploadPhoto,
);

/**
 * @desc    Upload multiple photos to S3
 * @route   POST /api/upload/photos/bulk
 * @access  Private (Admin, Sub-admin, Teacher)
 */
router.post(
  "/photos/bulk",
  authGuard,
  roleGuard("admin", "teacher"),
  uploadBulkMiddleware,
  handleMulterError,
  uploadBulkPhotos,
);

// ==================== File Management Routes ====================

/**
 * @desc    Delete file from S3 by key
 * @route   DELETE /api/upload/file/:key
 * @access  Private (Admin only)
 */
router.delete("/file/:key", authGuard, roleGuard("admin"), deleteFile);

module.exports = router;
