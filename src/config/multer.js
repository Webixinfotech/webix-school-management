const multer = require("multer");
const ErrorResponse = require("../utils/errorResponse");

// ==================== STUDENT PHOTO UPLOAD CONFIGURATION ====================

// Memory storage for S3 direct upload (no disk storage needed)
const studentStorage = multer.memoryStorage();

// ==================== TEACHER PHOTO UPLOAD CONFIGURATION ====================

// Memory storage for S3 direct upload (no disk storage needed)
const teacherStorage = multer.memoryStorage();

// ==================== GENERAL PHOTO UPLOAD CONFIGURATION ====================

// Memory storage for S3 direct upload (no disk storage needed)
const photoStorage = multer.memoryStorage();

// ==================== FILE FILTER ====================

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse("Only JPG, PNG, and WEBP images are allowed", 400));
  }
};

// ==================== UPLOAD MIDDLEWARE EXPORTS ====================

// Student photo upload (single, 5MB limit)
exports.uploadStudentPhoto = multer({
  storage: studentStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("photo");

// Teacher photo upload (single, 5MB limit)
exports.uploadTeacherPhoto = multer({
  storage: teacherStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("photo");

// Single photo upload (10MB limit)
exports.uploadSinglePhoto = multer({
  storage: photoStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("photo");

// Bulk photos upload (max 20 files, 10MB each)
exports.uploadBulkPhotos = multer({
  storage: photoStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
}).array("photos", 20);

// Multer error handler
exports.handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ErrorResponse("File size exceeds limit", 400));
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(
        new ErrorResponse("Unexpected field name. Use correct field name", 400),
      );
    }
    if (err instanceof ErrorResponse) {
      return next(err);
    }
    return next(new ErrorResponse(err.message || "File upload error", 400));
  }
  next();
};
