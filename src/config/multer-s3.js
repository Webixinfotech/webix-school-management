const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ErrorResponse = require("../utils/errorResponse");

// ==================== STORAGE CONFIGURATION ====================

// In-memory storage for S3 uploads
const memoryStorage = multer.memoryStorage();

// ==================== FILE FILTER ====================

/**
 * File filter for image uploads
 * @param {Object} req - Express request
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback function
 */
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        "Only JPEG, JPG, PNG, WEBP, and GIF images are allowed",
        400,
      ),
    );
  }
};

/**
 * File filter for photo uploads (no GIF)
 */
const photoFileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        "Only JPEG, JPG, PNG, and WEBP images are allowed",
        400,
      ),
    );
  }
};

// ==================== UPLOAD MIDDLEWARE EXPORTS ====================

/**
 * Avatar upload middleware (single file, 5MB limit)
 * Uses memory storage for S3 upload
 */
exports.uploadAvatar = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("avatar");

/**
 * Single photo upload middleware (single file, 10MB limit)
 * Uses memory storage for S3 upload
 */
exports.uploadSinglePhoto = multer({
  storage: memoryStorage,
  fileFilter: photoFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single("photo");

/**
 * Bulk photos upload middleware (max 20 files, 10MB each)
 * Uses memory storage for S3 upload
 */
exports.uploadBulkPhotos = multer({
  storage: memoryStorage,
  fileFilter: photoFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20, // Max 20 files
  },
}).array("photos", 20);

/**
 * Multiple file upload middleware (configurable)
 * @param {string} fieldName - Field name
 * @param {number} maxFiles - Maximum number of files
 * @param {number} maxSize - Maximum file size in bytes
 * @param {boolean} allowGif - Allow GIF files
 * @returns {Function} Multer middleware
 */
exports.uploadMultiple = (
  fieldName,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  allowGif = false,
) => {
  const allowedMimes = allowGif
    ? ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    : ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  return multer({
    storage: memoryStorage,
    fileFilter: (req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new ErrorResponse(
            `Invalid file type. Allowed types: ${allowedMimes.map((t) => t.split("/")[1]).join(", ")}`,
            400,
          ),
        );
      }
    },
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
  }).array(fieldName, maxFiles);
};

/**
 * Multer error handler middleware
 * @param {Object} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.handleMulterError = (err, req, res, next) => {
  if (err) {
    // Multer file size limit error
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ErrorResponse("File size exceeds the limit", 400));
    }

    // Multer unexpected file error
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(
        new ErrorResponse(`Unexpected field name. Use correct field name`, 400),
      );
    }

    // Multer file count limit error
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new ErrorResponse("Too many files uploaded", 400));
    }

    // Custom ErrorResponse
    if (err instanceof ErrorResponse) {
      return next(err);
    }

    // Generic upload error
    return next(new ErrorResponse(err.message || "File upload failed", 400));
  }

  next();
};

/**
 * Check if file was provided in request
 * @param {Object} req - Express request
 * @param {string} fieldName - Field name to check
 * @returns {boolean} Whether file exists
 */
exports.hasFile = (req, fieldName) => {
  return req.files ? req.files.length > 0 : !!req.file;
};
