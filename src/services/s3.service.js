const fs = require("fs");
const path = require("path");
const ErrorResponse = require("../utils/errorResponse");

// ==================== Local Uploads Configuration ====================

// Base uploads directory relative to the project root
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

// Ensure the base uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Generate the base URL for uploaded files
// In a real app, this might come from env var like BACKEND_URL
const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}/uploads/`;

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate unique file key for local storage (mimics S3 key)
 */
const generateFileKey = (folder, userId, originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop().toLowerCase();
  const fileName = `${folder}/${userId}/${folder}-${timestamp}-${randomString}.${ext}`;
  return fileName;
};

/**
 * Validate file type for images
 */
const isValidFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Get allowed file types by category
 */
const getAllowedFileTypes = (category) => {
  const fileTypes = {
    avatar: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
    photo: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  };
  return fileTypes[category] || fileTypes.photo;
};

// ==================== LOCAL UPLOAD SERVICE FUNCTIONS ====================

/**
 * Upload file locally (replacing S3)
 */
exports.uploadToS3 = async (file, folder, userId, category = "photo") => {
  try {
    // Validate file type
    const allowedTypes = getAllowedFileTypes(category);
    if (!isValidFileType(file.mimetype, allowedTypes)) {
      throw new ErrorResponse(
        `Invalid file type. Allowed types: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`,
        400,
      );
    }

    // Generate unique file key
    const fileKey = generateFileKey(folder, userId, file.originalname);
    
    // Construct the absolute path where the file will be saved
    const filePath = path.join(UPLOADS_DIR, fileKey);
    
    // Ensure the directory for this file exists
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // Write buffer to file
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `${baseUrl}${fileKey}`,
      key: fileKey,
      bucket: "local-storage",
      etag: Date.now().toString(),
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname,
    };
  } catch (error) {
    console.error("Local Upload Error:", error);
    if (error instanceof ErrorResponse) {
      throw error;
    }
    throw new ErrorResponse(
      `Failed to upload file locally: ${error.message}`,
      500,
    );
  }
};

/**
 * Delete file locally (replacing S3)
 */
exports.deleteFromS3 = async (key) => {
  try {
    const filePath = path.join(UPLOADS_DIR, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error("Local Delete Error:", error);
    return true; // Mimic S3 behavior of returning true even if file doesn't exist
  }
};

/**
 * Upload base64 image locally (replacing S3)
 */
exports.uploadBase64ToS3 = async (
  base64Data,
  folder,
  userId,
  category = "avatar",
) => {
  try {
    // Extract base64 data and mimetype
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new ErrorResponse("Invalid base64 image format", 400);
    }

    const mimetype = matches[1];
    const base64Image = matches[2];

    // Validate file type
    const allowedTypes = getAllowedFileTypes(category);
    if (!isValidFileType(mimetype, allowedTypes)) {
      throw new ErrorResponse(
        `Invalid image type. Allowed types: ${allowedTypes.map((t) => t.split("/")[1]).join(", ")}`,
        400,
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Image, "base64");
    const ext = mimetype.split("/")[1];
    const fileName = `image-${Date.now()}.${ext}`;

    // Generate unique file key
    const fileKey = generateFileKey(folder, userId, fileName);
    
    // Construct the absolute path
    const filePath = path.join(UPLOADS_DIR, fileKey);
    
    // Ensure the directory exists
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // Write buffer to file
    fs.writeFileSync(filePath, buffer);

    return {
      url: `${baseUrl}${fileKey}`,
      key: fileKey,
      bucket: "local-storage",
      etag: Date.now().toString(),
      size: buffer.length,
      mimetype,
    };
  } catch (error) {
    console.error("Local Base64 Upload Error:", error);
    if (error instanceof ErrorResponse) {
      throw error;
    }
    throw new ErrorResponse(
      `Failed to upload base64 image locally: ${error.message}`,
      500,
    );
  }
};

/**
 * Get file URL from key
 */
exports.getFileUrl = (key) => {
  return `${baseUrl}${key}`;
};

/**
 * Check if file exists locally
 */
exports.fileExists = async (key) => {
  try {
    const filePath = path.join(UPLOADS_DIR, key);
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

/**
 * Generate mock presigned URL for direct upload
 */
exports.generatePresignedUrl = async (
  folder,
  userId,
  fileName,
  fileType,
  expiresIn = 3600,
) => {
  // Since we are not using S3, true presigned URLs don't apply.
  // We mock the response to avoid breaking the client, but the client 
  // will need to use standard POST endpoints for local uploads.
  try {
    const fileKey = generateFileKey(folder, userId, fileName);
    const fileUrl = `${baseUrl}${fileKey}`;
    
    return {
      uploadUrl: "local_upload_not_supported_via_presigned_url",
      fileUrl,
      fileKey,
    };
  } catch (error) {
    console.error("Mock Presigned URL Error:", error);
    throw new ErrorResponse(
      `Failed to generate presigned URL locally: ${error.message}`,
      500,
    );
  }
};

/**
 * Export mock S3 client and config so other imports don't crash
 */
exports.s3Client = {};
exports.s3Config = { bucket: "local-storage", baseUrl };
