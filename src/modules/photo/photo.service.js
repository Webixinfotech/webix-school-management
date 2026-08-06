const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const PDFDocument = require("pdfkit");
const Photo = require("./photo.model");
const User = require("../auth/user.model");
const Parent = require("../shared/parent.model");
const Student = require("../student/student.model");
const Class = require("../../modules/class/class.model");
const ErrorResponse = require("../../utils/errorResponse");
const s3Service = require("../../services/s3.service");

// ==================== HELPER FUNCTIONS ====================

/**
 * Format delete message for display
 * @param {Object} photo - Photo document
 * @returns {string|null} Formatted delete message
 */
const getDeleteMessage = (photo) => {
  if (!photo.isDeleted || !photo.deletedAt) return null;
  const date = new Date(photo.deletedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `Deleted by: ${photo.deletedByName} (${photo.deletedByRole}) on ${date}`;
};

/**
 * Check if user can view photo based on role
 * @param {Object} photo - Photo document
 * @param {string} userRole - User role
 * @returns {boolean} Whether user can view the photo
 */
const canViewPhoto = (photo, userRole) => {
  if (userRole === "admin") return true;
  if (photo.isDeleted) return false;
  if (photo.status !== "approved") return false;
  return true;
};

/**
 * Parse JSON string safely
 * @param {string|Array} str - JSON string or array to parse
 * @returns {any} Parsed value or default
 */
const parseJsonSafely = (str, defaultValue = null) => {
  if (!str) return defaultValue;
  if (Array.isArray(str)) return str;
  if (typeof str === "object") return str;
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

// ==================== SERVICE FUNCTIONS ====================

/**
 * Upload single photo
 */
exports.uploadSinglePhoto = async (file, body, user) => {
  if (!file) {
    throw new ErrorResponse("Please upload a photo", 400);
  }

  // Upload to S3
  const uploadResult = await s3Service.uploadToS3(
    file,
    "photos",
    user._id.toString(),
    "photo",
  );

  const uploadType = parseJsonSafely(body.uploadType, ["parents"]);
  const tags = parseJsonSafely(body.tags, []);
  const targetClasses = parseJsonSafely(body.targetClasses, []);
  const targetParentIds = parseJsonSafely(body.targetParentIds, []);

  const photoData = {
    title: body.title || "",
    description: body.description || "",
    category: body.category || "Others",
    event: body.event || "",
    tags: Array.isArray(tags) ? tags : [],
    uploadType: Array.isArray(uploadType) ? uploadType : ["parents"],
    targetClasses: Array.isArray(targetClasses) ? targetClasses : [],
    targetParentIds: Array.isArray(targetParentIds) ? targetParentIds : [],
    imageUrl: uploadResult.url,
    imageKey: uploadResult.key, // Store S3 key for cleanup
    fileName: uploadResult.originalName,
    fileSize: uploadResult.size,
    mimeType: uploadResult.mimetype,
    uploadedBy: user._id,
    uploaderRole: user.role,
  };

  if (user.role === "admin") {
    photoData.status = "approved";
    photoData.approvedBy = user._id;
    photoData.approvedAt = new Date();
  } else {
    photoData.status = "pending";
  }

  const photo = await Photo.create(photoData);
  const populatedPhoto = await Photo.findById(photo._id).populate(
    "uploadedBy",
    "name role",
  );

  return {
    message:
      user.role === "admin"
        ? "Photo uploaded and published successfully"
        : "Photo uploaded successfully, awaiting admin approval",
    data: {
      ...populatedPhoto.toObject(),
      deleteMessage: getDeleteMessage(populatedPhoto),
    },
  };
};

/**
 * Upload bulk photos
 */
exports.uploadBulkPhotos = async (files, body, user) => {
  if (!files || files.length === 0) {
    throw new ErrorResponse("Please upload at least one photo", 400);
  }

  // Upload all files to S3
  const uploadPromises = files.map((file) =>
    s3Service.uploadToS3(file, "photos", user._id.toString(), "photo"),
  );

  const uploadResults = await Promise.all(uploadPromises);

  const uploadType = parseJsonSafely(body.uploadType, ["parents"]);
  const tags = parseJsonSafely(body.tags, []);
  const targetClasses = parseJsonSafely(body.targetClasses, []);
  const targetParentIds = parseJsonSafely(body.targetParentIds, []);
  const category = body.category || "Others";
  const event = body.event || "";

  const photosData = uploadResults.map((uploadResult, index) => {
    const photoData = {
      title: body.title || "",
      description: body.description || "",
      category: category,
      event: event,
      tags: Array.isArray(tags) ? tags : [],
      uploadType: Array.isArray(uploadType) ? uploadType : ["parents"],
      targetClasses: Array.isArray(targetClasses) ? targetClasses : [],
      targetParentIds: Array.isArray(targetParentIds) ? targetParentIds : [],
      imageUrl: uploadResult.url,
      imageKey: uploadResult.key, // Store S3 key for cleanup
      fileName: uploadResult.originalName,
      fileSize: uploadResult.size,
      mimeType: uploadResult.mimetype,
      uploadedBy: user._id,
      uploaderRole: user.role,
    };

    if (user.role === "admin") {
      photoData.status = "approved";
      photoData.approvedBy = user._id;
      photoData.approvedAt = new Date();
    } else {
      photoData.status = "pending";
    }

    return photoData;
  });

  const photos = await Photo.create(photosData);

  return {
    message:
      user.role === "admin"
        ? `${photos.length} photos uploaded and published successfully`
        : `${photos.length} photos uploaded successfully, awaiting admin approval`,
    count: photos.length,
    data: photos.map((photo) => ({
      ...photo.toObject(),
      deleteMessage: getDeleteMessage(photo),
    })),
  };
};

/**
 * Get all photos with filtering and pagination
 */
exports.getPhotos = async (queryOptions, userRole, userId) => {
  const {
    status,
    uploadType,
    category,
    uploaderRole,
    isDeleted,
    uploadedBy,
    search,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = queryOptions;

  let query = {};

  if (userRole === "admin") {
    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted === "true";
    }
  } else if (userRole === "teacher") {
    query = {
      $or: [{ uploadedBy: userId }, { status: "approved", isDeleted: false }],
    };
  } else if (userRole === "parent") {
    const parentDoc = await Parent.findOne({ userId }).populate("children");

    if (!parentDoc || !parentDoc.children || parentDoc.children.length === 0) {
      return {
        total: 0,
        page: parseInt(page),
        pages: 0,
        count: 0,
        data: [],
      };
    }

    const childClasses = parentDoc.children
      .map((child) => {
        if (child.className && child.section) {
          return `${child.className}${child.section}`;
        }
        return child.className;
      })
      .filter(Boolean);

    query = {
      status: "approved",
      isDeleted: false,
      $or: [
        { targetClasses: { $size: 0 } },
        { targetClasses: { $in: childClasses } },
        { targetParentIds: { $in: [parentDoc._id] } },
      ],
    };

    if (uploadType) {
      query.uploadType = { $in: [uploadType] };
    } else {
      query.uploadType = { $in: ["parents", "website"] };
    }
  }

  if (userRole !== "teacher") {
    if (status && userRole === "admin") {
      query.status = status;
    }
    if (uploadType && userRole !== "parent") {
      query.uploadType = { $in: [uploadType] };
    }
    if (category) {
      query.category = category;
    }
    if (uploaderRole && userRole === "admin") {
      query.uploaderRole = uploaderRole;
    }
    if (uploadedBy && userRole === "admin") {
      query.uploadedBy = uploadedBy;
    }
  }

  if (
    search &&
    (userRole === "admin" || userRole === "teacher")
  ) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { event: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  if (dateFrom || dateTo) {
    query.uploadedAt = {};
    if (dateFrom) {
      query.uploadedAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      query.uploadedAt.$lte = new Date(dateTo);
    }
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Photo.countDocuments(query);
  const photos = await Photo.find(query)
    .populate("uploadedBy", "name role email")
    .populate("approvedBy", "name role")
    .populate("deletedBy", "name role")
    .sort({ uploadedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const photosWithDeleteMessage = photos.map((photo) => ({
    ...photo.toObject(),
    deleteMessage: getDeleteMessage(photo),
  }));

  return {
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: photosWithDeleteMessage.length,
    data: photosWithDeleteMessage,
  };
};

/**
 * Get photos for public website (No auth required)
 */
exports.getWebsitePhotos = async (queryOptions) => {
  const { category, page = 1, limit = 20 } = queryOptions;

  const query = {
    status: "approved",
    isDeleted: false,
    uploadType: { $in: ["website"] },
  };

  if (category) {
    query.category = category;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Photo.countDocuments(query);
  const photos = await Photo.find(query)
    .select(
      "title description category event tags imageUrl fileName uploadedAt viewsCount likesCount",
    ) // Safely select only public fields
    .sort({ uploadedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: photos.length,
    data: photos,
  };
};

/**
 * Get single photo by ID
 */
exports.getPhoto = async (photoId, userRole) => {
  const photo = await Photo.findById(photoId)
    .populate("uploadedBy", "name role email")
    .populate("approvedBy", "name role")
    .populate("deletedBy", "name role");

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (!canViewPhoto(photo, userRole)) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (userRole !== "admin" && !photo.isDeleted) {
    await Photo.findByIdAndUpdate(photo._id, { $inc: { viewsCount: 1 } });
  }

  return {
    ...photo.toObject(),
    deleteMessage: getDeleteMessage(photo),
  };
};

/**
 * Get pending photos for admin approval
 */
exports.getPendingPhotos = async () => {
  const photos = await Photo.find({
    status: "pending",
    isDeleted: false,
  })
    .populate("uploadedBy", "name email phone role")
    .sort({ uploadedAt: 1 });

  return {
    count: photos.length,
    data: photos.map((photo) => ({
      ...photo.toObject(),
      deleteMessage: getDeleteMessage(photo),
    })),
  };
};

/**
 * Approve a photo
 */
exports.approvePhoto = async (photoId, userId, uploadType) => {
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (photo.status === "approved") {
    throw new ErrorResponse("Photo is already approved", 400);
  }

  if (photo.isDeleted) {
    throw new ErrorResponse("Cannot approve a deleted photo", 400);
  }

  const parsedUploadType = parseJsonSafely(uploadType, photo.uploadType);

  photo.status = "approved";
  photo.approvedBy = userId;
  photo.approvedAt = new Date();
  if (Array.isArray(parsedUploadType)) {
    photo.uploadType = parsedUploadType;
  }

  await photo.save();

  const updatedPhoto = await Photo.findById(photo._id)
    .populate("uploadedBy", "name role")
    .populate("approvedBy", "name role");

  return {
    message: "Photo approved successfully",
    data: {
      ...updatedPhoto.toObject(),
      deleteMessage: getDeleteMessage(updatedPhoto),
    },
  };
};

/**
 * Reject a photo
 */
exports.rejectPhoto = async (photoId, userId, rejectionReason) => {
  if (!rejectionReason || rejectionReason.trim() === "") {
    throw new ErrorResponse("Please provide a rejection reason", 400);
  }

  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (photo.status === "rejected") {
    throw new ErrorResponse("Photo is already rejected", 400);
  }

  photo.status = "rejected";
  photo.rejectedBy = userId;
  photo.rejectedAt = new Date();
  photo.rejectionReason = rejectionReason.trim();

  await photo.save();

  const updatedPhoto = await Photo.findById(photo._id)
    .populate("uploadedBy", "name role")
    .populate("rejectedBy", "name role");

  return {
    message: "Photo rejected successfully",
    data: {
      ...updatedPhoto.toObject(),
      deleteMessage: getDeleteMessage(updatedPhoto),
    },
  };
};

/**
 * Soft delete a photo
 */
exports.softDeletePhoto = async (photoId, user) => {
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (user.role === "teacher") {
    if (photo.uploadedBy.toString() !== user._id.toString()) {
      throw new ErrorResponse("You can only delete your own photos", 403);
    }
  }

  if (photo.isDeleted) {
    throw new ErrorResponse("Photo is already deleted", 400);
  }

  photo.isDeleted = true;
  photo.deletedBy = user._id;
  photo.deletedByRole = user.role;
  photo.deletedByName = user.name;
  photo.deletedAt = new Date();
  photo.deleteType = "soft";

  await photo.save();

  const updatedPhoto = await Photo.findById(photo._id).populate(
    "deletedBy",
    "name role",
  );

  return {
    message: "Photo deleted successfully",
    data: {
      ...updatedPhoto.toObject(),
      deleteMessage: getDeleteMessage(updatedPhoto),
    },
  };
};

/**
 * Hard delete a photo (permanent)
 */
exports.hardDeletePhoto = async (photoId) => {
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  // Delete from S3 if imageKey exists
  if (photo.imageKey) {
    try {
      await s3Service.deleteFromS3(photo.imageKey);
    } catch (s3Error) {
      console.log("S3 file not found or already deleted:", photo.imageKey);
    }
  } else if (photo.imageUrl && photo.imageUrl.startsWith("http")) {
    // Legacy: Try to extract key from URL or skip if it's external
    console.log("Legacy photo with external URL, skipping S3 delete");
  } else {
    // Legacy local file delete
    try {
      const localPath = path.join(__dirname, "..", "..", "..", photo.imageUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (fileErr) {
      console.log("Local file not found or already deleted:", photo.imageUrl);
    }
  }

  await Photo.findByIdAndDelete(photoId);

  return { message: "Photo permanently deleted" };
};

/**
 * Restore a soft-deleted photo
 */
exports.restorePhoto = async (photoId) => {
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (!photo.isDeleted) {
    throw new ErrorResponse("Photo is not deleted, nothing to restore", 400);
  }

  photo.isDeleted = false;
  photo.deletedBy = null;
  photo.deletedByRole = "";
  photo.deletedByName = "";
  photo.deletedAt = null;
  photo.deleteType = "";

  await photo.save();

  const restoredPhoto = await Photo.findById(photo._id)
    .populate("uploadedBy", "name role")
    .populate("approvedBy", "name role");

  return {
    message: "Photo restored successfully",
    data: {
      ...restoredPhoto.toObject(),
      deleteMessage: getDeleteMessage(restoredPhoto),
    },
  };
};

/**
 * Get deleted photos
 */
exports.getDeletedPhotos = async (filters) => {
  const { dateFrom, dateTo, category, deletedByRole } = filters;

  const query = { isDeleted: true };

  if (category) {
    query.category = category;
  }

  if (deletedByRole) {
    query.deletedByRole = deletedByRole;
  }

  if (dateFrom || dateTo) {
    query.deletedAt = {};
    if (dateFrom) {
      query.deletedAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      query.deletedAt.$lte = new Date(dateTo);
    }
  }

  const photos = await Photo.find(query)
    .populate("deletedBy", "name role")
    .populate("uploadedBy", "name role")
    .sort({ deletedAt: -1 });

  return {
    count: photos.length,
    data: photos.map((photo) => ({
      ...photo.toObject(),
      deleteMessage: getDeleteMessage(photo),
    })),
  };
};

/**
 * Like/Unlike a photo
 */
exports.likePhoto = async (photoId, userId) => {
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (photo.status !== "approved" || photo.isDeleted) {
    throw new ErrorResponse("Photo not available", 400);
  }

  const likedIndex = photo.likedBy.findIndex((id) => id.toString() === userId);

  let liked;
  if (likedIndex !== -1) {
    photo.likedBy.splice(likedIndex, 1);
    photo.likesCount = Math.max(0, photo.likesCount - 1);
    liked = false;
  } else {
    photo.likedBy.push(userId);
    photo.likesCount += 1;
    liked = true;
  }

  await photo.save();

  return {
    liked,
    likesCount: photo.likesCount,
  };
};

/**
 * Download a photo
 */
exports.downloadPhoto = async (photoId) => {
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (photo.isDeleted) {
    throw new ErrorResponse("Photo not available for download", 400);
  }

  photo.downloadsCount += 1;
  await photo.save();

  return {
    imageUrl: photo.imageUrl,
    imageKey: photo.imageKey,
    fileName: photo.fileName,
    mimeType: photo.mimeType || "image/jpeg",
  };
};

/**
 * Update photo details
 */
exports.updatePhoto = async (photoId, body, user) => {
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (user.role === "teacher") {
    if (photo.uploadedBy.toString() !== user._id.toString()) {
      throw new ErrorResponse("You can only update your own photos", 403);
    }
    if (photo.status !== "pending") {
      throw new ErrorResponse("You can only update pending photos", 400);
    }
  }

  const updatableFields = [
    "title",
    "description",
    "category",
    "event",
    "tags",
    "targetClasses",
    "targetParentIds",
  ];

  updatableFields.forEach((field) => {
    if (body[field] !== undefined) {
      const value = parseJsonSafely(body[field], body[field]);
      photo[field] = Array.isArray(value) ? value : body[field];
    }
  });

  if (user.role === "admin") {
    if (body.uploadType) {
      const uploadType = parseJsonSafely(body.uploadType, photo.uploadType);
      if (Array.isArray(uploadType)) {
        photo.uploadType = uploadType;
      }
    }
  }

  await photo.save();

  const updatedPhoto = await Photo.findById(photo._id)
    .populate("uploadedBy", "name role")
    .populate("approvedBy", "name role");

  return {
    message: "Photo updated successfully",
    data: {
      ...updatedPhoto.toObject(),
      deleteMessage: getDeleteMessage(updatedPhoto),
    },
  };
};

/**
 * Bulk delete photos
 */
exports.bulkDeletePhotos = async (body, user) => {
  const { photoIds, deleteType, filters } = body;

  if (!deleteType || !["soft", "hard"].includes(deleteType)) {
    throw new ErrorResponse(
      'Please provide valid deleteType: "soft" or "hard"',
      400,
    );
  }

  let query = {};

  if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
    query._id = { $in: photoIds };
  } else if (filters) {
    if (filters.selectAll) {
      query.deleteType = { $ne: "hard" };
    } else {
      if (filters.dateFrom || filters.dateTo) {
        query.uploadedAt = {};
        if (filters.dateFrom) {
          query.uploadedAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.uploadedAt.$lte = new Date(filters.dateTo);
        }
      }
      if (filters.category) {
        query.category = filters.category;
      }
      query.deleteType = { $ne: "hard" };
    }
  } else {
    throw new ErrorResponse("Please provide photoIds or filters", 400);
  }

  const photos = await Photo.find(query);

  if (photos.length === 0) {
    throw new ErrorResponse("No photos found for deletion", 404);
  }

  if (deleteType === "soft") {
    const updateData = {
      isDeleted: true,
      deletedBy: user._id,
      deletedByName: user.name,
      deletedByRole: user.role,
      deletedAt: new Date(),
      deleteType: "soft",
    };

    await Photo.updateMany(
      { _id: { $in: photos.map((p) => p._id) } },
      { $set: updateData },
    );

    return {
      message: `${photos.length} photos deleted successfully`,
      count: photos.length,
    };
  } else {
    let deletedCount = 0;
    let failedCount = 0;

    for (const photo of photos) {
      try {
        // S3 deletion takes priority (photo.imageKey is the source of truth)
        if (photo.imageKey) {
          try {
            await s3Service.deleteFromS3(photo.imageKey);
          } catch (s3Error) {
            console.log("S3 file not found or already deleted:", photo.imageKey);
          }
        }
        // Fallback: local file (legacy path, no imageKey)
        if (!photo.imageKey && photo.imageUrl) {
          try {
            fs.unlinkSync(photo.imageUrl);
          } catch (fileErr) {
            console.log("Local file not found:", photo.imageUrl);
          }
        }

        await Photo.findByIdAndDelete(photo._id);
        deletedCount++;
      } catch (err) {
        failedCount++;
        console.error("Error deleting photo:", photo._id, err);
      }
    }

    return {
      message: `${deletedCount} photos permanent deleted${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
      count: deletedCount,
    };
  }
};

/**
 * Bulk download photos as ZIP with PDF report
 */
exports.bulkDownloadZip = async (body, user) => {
  const { photoIds, filters, zipDescription, zipTitle } = body;

  let query = { status: "approved", isDeleted: false };

  if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
    query._id = { $in: photoIds };
  } else if (filters) {
    if (!filters.selectAll) {
      if (filters.dateFrom || filters.dateTo) {
        query.uploadedAt = {};
        if (filters.dateFrom) {
          query.uploadedAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.uploadedAt.$lte = new Date(filters.dateTo);
        }
      }
      if (filters.category) {
        query.category = filters.category;
      }
    }
  } else {
    throw new ErrorResponse("Please provide photoIds or filters", 400);
  }

  const photos = await Photo.find(query)
    .populate("uploadedBy", "name role")
    .sort({ category: 1, uploadedAt: -1 });

  if (photos.length === 0) {
    throw new ErrorResponse(
      "No photos found for download. Make sure you have approved photos in the database matching your filters.",
      404,
    );
  }

  const timestamp = Date.now();
  const tempDir = path.join(__dirname, "..", "..", "..", "uploads", "temp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const pdfPath = path.join(tempDir, `backup_report_${timestamp}.pdf`);

  const doc = new PDFDocument({ margin: 30 });
  const writeStream = fs.createWriteStream(pdfPath);
  doc.pipe(writeStream);

  doc
    .fontSize(24)
    .text("BrainBuilder Photo Backup Report", { align: "center" });
  doc.moveDown();

  doc
    .fontSize(12)
    .text("School: BrainBuilder School Management System", { align: "left" });
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, {
    align: "left",
  });
  doc.text(`Generated by: ${user.name} (${user.role})`, { align: "left" });
  doc.moveDown();

  if (zipDescription) {
    doc.fontSize(12).text("Description:", { underline: true });
    doc.fontSize(11).text(zipDescription);
    doc.moveDown();
  }

  if (filters) {
    if (filters.dateFrom || filters.dateTo) {
      doc.text(
        `Date Range: ${filters.dateFrom || "Start"} to ${filters.dateTo || "Present"}`,
      );
    }
    if (filters.category) {
      doc.text(`Category: ${filters.category}`);
    }
  }

  doc.moveDown();
  doc.fontSize(12).text(`Total Photos: ${photos.length}`, { underline: true });
  doc.moveDown();

  const tableTop = doc.y;
  const tableLeft = 30;
  const colWidths = [40, 150, 100, 50, 100, 80, 60];
  const rowHeight = 20;

  doc.fontSize(10);
  doc.text("Sr.", tableLeft, tableTop, {
    width: colWidths[0],
    align: "center",
    bold: true,
  });
  doc.text("Photo Name", tableLeft + colWidths[0], tableTop, {
    width: colWidths[1],
    bold: true,
  });
  doc.text("Uploaded By", tableLeft + colWidths[0] + colWidths[1], tableTop, {
    width: colWidths[2],
    bold: true,
  });
  doc.text(
    "Role",
    tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
    tableTop,
    { width: colWidths[3], align: "center", bold: true },
  );
  doc.text(
    "Upload Date",
    tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
    tableTop,
    { width: colWidths[4], bold: true },
  );
  doc.text(
    "Category",
    tableLeft +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] +
      colWidths[3] +
      colWidths[4],
    tableTop,
    { width: colWidths[5], bold: true },
  );
  doc.text(
    "Status",
    tableLeft +
      colWidths[0] +
      colWidths[1] +
      colWidths[2] +
      colWidths[3] +
      colWidths[4] +
      colWidths[5],
    tableTop,
    { width: colWidths[6], align: "center", bold: true },
  );

  let yPos = tableTop + rowHeight;

  doc.fontSize(9);
  photos.forEach((photo, index) => {
    if (yPos > 750) {
      doc.addPage();
      yPos = 30;
    }

    const title = (photo.title || photo.fileName).substring(0, 35);
    const uploaderName = photo.uploadedBy ? photo.uploadedBy.name : "Unknown";
    const uploadDate = new Date(photo.uploadedAt).toLocaleDateString("en-IN");

    doc.text((index + 1).toString(), tableLeft, yPos, {
      width: colWidths[0],
      align: "center",
    });
    doc.text(title, tableLeft + colWidths[0], yPos, { width: colWidths[1] });
    doc.text(
      uploaderName.substring(0, 20),
      tableLeft + colWidths[0] + colWidths[1],
      yPos,
      { width: colWidths[2] },
    );
    doc.text(
      photo.uploaderRole || "N/A",
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2],
      yPos,
      { width: colWidths[3], align: "center" },
    );
    doc.text(
      uploadDate,
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
      yPos,
      { width: colWidths[4] },
    );
    doc.text(
      photo.category,
      tableLeft +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] +
        colWidths[4],
      yPos,
      { width: colWidths[5] },
    );
    doc.text(
      photo.status,
      tableLeft +
        colWidths[0] +
        colWidths[1] +
        colWidths[2] +
        colWidths[3] +
        colWidths[4] +
        colWidths[5],
      yPos,
      { width: colWidths[6], align: "center" },
    );

    yPos += rowHeight;
  });

  doc.moveDown(2);
  doc
    .fontSize(10)
    .text("Generated by BrainBuilder School Management System", {
      align: "center",
      italics: true,
    });

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  const zipFileName = `BrainBuilder_Photos_${timestamp}.zip`;

  const photoIdsToUpdate = photos.map((p) => p._id);
  await Photo.updateMany(
    { _id: { $in: photoIdsToUpdate } },
    { $inc: { downloadsCount: 1 } },
  );

  return {
    zipFileName,
    photos,
    pdfPath,
    tempDir,
  };
};

/**
 * Get photo statistics
 */
exports.getPhotoStats = async () => {
  const total = await Photo.countDocuments();
  const pending = await Photo.countDocuments({ status: "pending" });
  const approved = await Photo.countDocuments({ status: "approved" });
  const rejected = await Photo.countDocuments({ status: "rejected" });
  const deleted = await Photo.countDocuments({ isDeleted: true });

  const totalByCategory = await Photo.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const totalByUploader = await Photo.aggregate([
    { $group: { _id: "$uploaderRole", count: { $sum: 1 } } },
  ]);

  const engagementStats = await Photo.aggregate([
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likesCount" },
        totalDownloads: { $sum: "$downloadsCount" },
        totalViews: { $sum: "$viewsCount" },
      },
    },
  ]);

  const recentUploads = await Photo.find()
    .populate("uploadedBy", "name role")
    .sort({ uploadedAt: -1 })
    .limit(5);

  const storageStats = await Photo.aggregate([
    {
      $group: {
        _id: null,
        totalSize: { $sum: "$fileSize" },
      },
    },
  ]);

  const totalSizeBytes =
    storageStats.length > 0 ? storageStats[0].totalSize : 0;
  const storageUsedMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  const categoryStats = {};
  totalByCategory.forEach((item) => {
    categoryStats[item._id] = item.count;
  });

  const uploaderStats = {};
  totalByUploader.forEach((item) => {
    uploaderStats[item._id] = item.count;
  });

  const engagement =
    engagementStats.length > 0
      ? engagementStats[0]
      : {
          totalLikes: 0,
          totalDownloads: 0,
          totalViews: 0,
        };

  return {
    total,
    pending,
    approved,
    rejected,
    deleted,
    totalByCategory: categoryStats,
    totalByUploader: uploaderStats,
    totalLikes: engagement.totalLikes,
    totalDownloads: engagement.totalDownloads,
    totalViews: engagement.totalViews,
    recentUploads: recentUploads.map((photo) => ({
      ...photo.toObject(),
      deleteMessage: getDeleteMessage(photo),
    })),
    storageUsed: `${storageUsedMB} MB`,
  };
};

/**
 * Get teacher's own photos
 */
exports.getMyPhotos = async (userId, filters) => {
  const { status, category, page = 1, limit = 20 } = filters;

  const query = { uploadedBy: userId };

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Photo.countDocuments(query);
  const photos = await Photo.find(query)
    .populate("uploadedBy", "name role")
    .populate("approvedBy", "name role")
    .populate("deletedBy", "name role")
    .sort({ uploadedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const statusCounts = {
    pending: await Photo.countDocuments({
      uploadedBy: userId,
      status: "pending",
    }),
    approved: await Photo.countDocuments({
      uploadedBy: userId,
      status: "approved",
    }),
    rejected: await Photo.countDocuments({
      uploadedBy: userId,
      status: "rejected",
    }),
  };

  return {
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    count: photos.length,
    statusCounts,
    data: photos.map((photo) => ({
      ...photo.toObject(),
      deleteMessage: getDeleteMessage(photo),
    })),
  };
};

/**
 * Parent bulk download selected photos
 */
exports.parentBulkDownload = async (photoIds, userId) => {
  if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
    throw new ErrorResponse("Please provide photoIds array", 400);
  }

  const parentDoc = await Parent.findOne({ userId }).populate("children");

  if (!parentDoc || !parentDoc.children || parentDoc.children.length === 0) {
    throw new ErrorResponse("No children found for this parent", 404);
  }

  const childClasses = parentDoc.children
    .map((child) => {
      if (child.className && child.section) {
        return `${child.className}${child.section}`;
      }
      return child.className;
    })
    .filter(Boolean);

  const photos = await Photo.find({
    _id: { $in: photoIds },
    status: "approved",
    isDeleted: false,
    $or: [
      { targetClasses: { $size: 0 } },
      { targetClasses: { $in: childClasses } },
      { targetParentIds: { $in: [parentDoc._id] } },
    ],
  })
    .populate("uploadedBy", "name role")
    .sort({ category: 1, uploadedAt: -1 });

  if (photos.length === 0) {
    throw new ErrorResponse("No accessible photos found", 404);
  }

  const timestamp = Date.now();

  const photoIdsToUpdate = photos.map((p) => p._id);
  await Photo.updateMany(
    { _id: { $in: photoIdsToUpdate } },
    { $inc: { downloadsCount: 1 } },
  );

  return {
    zipFileName: `My_Photos_${timestamp}.zip`,
    photos,
  };
};

/**
 * Toggle photo website visibility
 */
/**
 * Toggle photo website visibility
 */
exports.toggleWebsite = async (photoId) => {
  const photo = await Photo.findById(photoId);

  if (!photo) {
    throw new ErrorResponse("Photo not found", 404);
  }

  if (photo.isDeleted) {
    throw new ErrorResponse("Cannot toggle a deleted photo", 400);
  }

  const hasWebsite = photo.uploadType.includes("website");

  if (hasWebsite) {
    photo.uploadType = photo.uploadType.filter((t) => t !== "website");
  } else {
    photo.uploadType = [...new Set([...photo.uploadType, "website"])];
  }

  await photo.save();

  const updatedPhoto = await Photo.findById(photo._id)
    .populate("uploadedBy", "name role")
    .populate("approvedBy", "name role");

  return {
    message: hasWebsite
      ? "Photo removed from website"
      : "Photo published to website",
    data: {
      ...updatedPhoto.toObject(),
      deleteMessage: getDeleteMessage(updatedPhoto),
    },
  };
};
/**
 * Get classes and students for teacher to select target audience
 */
exports.getTargetAudience = async () => {
  const classes = await Student.distinct("className", { status: "Active" });

  const students = await Student.find({ status: "Active" })
    .select("className section firstName lastName")
    .lean();

  const classSections = {};
  students.forEach((student) => {
    const classKey = student.className;
    const section = student.section || "";
    const fullName = `${student.firstName} ${student.lastName}`;

    if (!classSections[classKey]) {
      classSections[classKey] = {
        sections: {},
        allStudents: [],
      };
    }

    if (section) {
      if (!classSections[classKey].sections[section]) {
        classSections[classKey].sections[section] = [];
      }
      classSections[classKey].sections[section].push({
        name: fullName,
        className: `${classKey}${section}`,
      });
    }

    classSections[classKey].allStudents.push({
      name: fullName,
      className: section ? `${classKey}${section}` : classKey,
    });
  });

  const parents = await Parent.find()
    .populate("userId", "name email phone")
    .populate("children", "firstName lastName className section")
    .select("children userId")
    .lean();

  const parentList = parents
    .filter((p) => p.children && p.children.length > 0 && p.userId)
    .map((p) => ({
      _id: p._id,
      parentName: p.userId.name,
      parentEmail: p.userId.email,
      parentPhone: p.userId.phone,
      children: p.children.map((c) => ({
        name: `${c.firstName} ${c.lastName}`,
        className: c.section ? `${c.className}${c.section}` : c.className,
      })),
    }));

  return {
    classes: Object.keys(classSections).sort(),
    classSections,
    parents: parentList,
  };
};