const fs = require("fs");
const archiver = require("archiver");
const photoService = require("./photo.service");

/**
 * @desc    Upload single photo
 * @route   POST /api/photos/upload/single
 * @access  Admin, Sub-admin, Teacher
 */
exports.uploadSinglePhoto = async (req, res, next) => {
  try {
    const result = await photoService.uploadSinglePhoto(
      req.file,
      req.body,
      req.user,
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload bulk photos
 * @route   POST /api/photos/upload/bulk
 * @access  Admin, Sub-admin, Teacher
 */
exports.uploadBulkPhotos = async (req, res, next) => {
  try {
    const result = await photoService.uploadBulkPhotos(
      req.files,
      req.body,
      req.user,
    );

    res.status(201).json({
      success: true,
      message: result.message,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all photos with filtering and pagination
 * @route   GET /api/photos
 * @access  All roles (filtered by role)
 */
exports.getPhotos = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;

    const result = await photoService.getPhotos(
      { ...filters, page: page || 1, limit: limit || 20 },
      req.user.role,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get public photos for website
 * @route   GET /api/photos/public/website
 * @access  Public (No Auth Required)
 */
exports.getWebsitePhotos = async (req, res, next) => {
  try {
    const result = await photoService.getWebsitePhotos(req.query);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single photo by ID
 * @route   GET /api/photos/:id
 * @access  All roles
 */
exports.getPhoto = async (req, res, next) => {
  try {
    const data = await photoService.getPhoto(req.params.id, req.user.role);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get pending photos for admin approval
 * @route   GET /api/photos/pending
 * @access  Admin, Sub-admin
 */
exports.getPendingPhotos = async (req, res, next) => {
  try {
    const result = await photoService.getPendingPhotos();

    res.status(200).json({
      success: true,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Approve a photo
 * @route   POST /api/photos/:id/approve
 * @access  Admin, Sub-admin
 */
exports.approvePhoto = async (req, res, next) => {
  try {
    const result = await photoService.approvePhoto(
      req.params.id,
      req.user._id,
      req.body.uploadType,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reject a photo
 * @route   POST /api/photos/:id/reject
 * @access  Admin, Sub-admin
 */
exports.rejectPhoto = async (req, res, next) => {
  try {
    const result = await photoService.rejectPhoto(
      req.params.id,
      req.user._id,
      req.body.rejectionReason,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Soft delete a photo
 * @route   POST /api/photos/:id/soft-delete
 * @access  Admin, Sub-admin, Teacher (own only)
 */
exports.softDeletePhoto = async (req, res, next) => {
  try {
    const result = await photoService.softDeletePhoto(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Hard delete a photo (permanent)
 * @route   DELETE /api/photos/:id/hard-delete
 * @access  Admin only
 */
exports.hardDeletePhoto = async (req, res, next) => {
  try {
    const result = await photoService.hardDeletePhoto(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Restore a soft-deleted photo
 * @route   POST /api/photos/:id/restore
 * @access  Admin only
 */
exports.restorePhoto = async (req, res, next) => {
  try {
    const result = await photoService.restorePhoto(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get deleted photos
 * @route   GET /api/photos/deleted
 * @access  Admin only
 */
exports.getDeletedPhotos = async (req, res, next) => {
  try {
    const result = await photoService.getDeletedPhotos(req.query);

    res.status(200).json({
      success: true,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Like/Unlike a photo
 * @route   POST /api/photos/:id/like
 * @access  Parent only
 */
exports.likePhoto = async (req, res, next) => {
  try {
    const data = await photoService.likePhoto(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Download a photo
 * @route   GET /api/photos/:id/download
 * @access  Admin, Parent
 */
exports.downloadPhoto = async (req, res, next) => {
  try {
    const { imageUrl, fileName, mimeType } = await photoService.downloadPhoto(
      req.params.id,
    );

    // Fetch the image from S3 and stream it to the client
    const https = require("https");
    const http = require("http");
    const protocol = imageUrl.startsWith("https") ? https : http;

    protocol.get(imageUrl, (s3Res) => {
      if (s3Res.statusCode !== 200) {
        return next(new Error("Failed to fetch image from storage"));
      }

      const safeFileName = (fileName || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");

      res.setHeader("Content-Type", mimeType || s3Res.headers["content-type"] || "image/jpeg");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (s3Res.headers["content-length"]) {
        res.setHeader("Content-Length", s3Res.headers["content-length"]);
      }

      s3Res.pipe(res);
    }).on("error", (err) => {
      next(err);
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update photo details
 * @route   PUT /api/photos/:id
 * @access  Admin, Sub-admin, Teacher (own pending only)
 */
exports.updatePhoto = async (req, res, next) => {
  try {
    const result = await photoService.updatePhoto(
      req.params.id,
      req.body,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk delete photos
 * @route   POST /api/photos/bulk/delete
 * @access  Admin only
 */
exports.bulkDeletePhotos = async (req, res, next) => {
  try {
    const result = await photoService.bulkDeletePhotos(req.body, req.user);

    res.status(200).json({
      success: true,
      message: result.message,
      count: result.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk download photos as ZIP with PDF report
 * @route   POST /api/photos/bulk/download
 * @access  Admin only
 */
exports.bulkDownloadZip = async (req, res, next) => {
  try {
    const { zipFileName, photos, pdfPath, tempDir } =
      await photoService.bulkDownloadZip(req.body, req.user);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${zipFileName}`);

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res);

    const categories = {};
    photos.forEach((photo) => {
      const category = photo.category || "Others";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(photo);
    });

    let addedCount = 0;
    let skipCount = 0;
    for (const [category, categoryPhotos] of Object.entries(categories)) {
      const safeCategoryName = category.replace(/[^a-z0-9]/gi, "_");
      for (const photo of categoryPhotos) {
        try {
          const imageResponse = await fetch(photo.imageUrl);
          if (imageResponse.ok) {
            const buffer = await imageResponse.arrayBuffer();
            archive.append(Buffer.from(buffer), {
              name: `${safeCategoryName}/${photo.fileName}`,
            });
            addedCount++;
          } else {
            skipCount++;
          }
        } catch (err) {
          skipCount++;
        }
      }
    }

    archive.file(pdfPath, { name: "Backup_Report.pdf" });

    await archive.finalize();

    const finishCleanup = () => {
      try {
        fs.unlinkSync(pdfPath);
      } catch (err) {
        console.log("Error deleting temp PDF:", err);
      }
    };
    res.on("finish", finishCleanup);
    res.on("close", finishCleanup);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get photo statistics
 * @route   GET /api/photos/stats
 * @access  Admin, Sub-admin
 */
exports.getPhotoStats = async (req, res, next) => {
  try {
    const data = await photoService.getPhotoStats();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get teacher's own photos
 * @route   GET /api/photos/my
 * @access  Teacher only
 */
exports.getMyPhotos = async (req, res, next) => {
  try {
    const result = await photoService.getMyPhotos(req.user._id, req.query);

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      statusCounts: result.statusCounts,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Parent bulk download selected photos
 * @route   POST /api/photos/parent-bulk-download
 * @access  Parent only
 */
exports.parentBulkDownload = async (req, res, next) => {
  try {
    const { zipFileName, photos } = await photoService.parentBulkDownload(
      req.body.photoIds,
      req.user._id,
    );

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${zipFileName}`);

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res);

    const categories = {};
    photos.forEach((photo) => {
      const category = photo.category || "Others";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(photo);
    });

    let addedCount = 0;
    for (const [category, categoryPhotos] of Object.entries(categories)) {
      const safeCategoryName = category.replace(/[^a-z0-9]/gi, "_");
      for (const photo of categoryPhotos) {
        try {
          // photo.imageUrl is an S3 URL, not a local filesystem path — fetch
          // it over HTTP (same approach as the admin bulkDownloadZip above).
          const imageResponse = await fetch(photo.imageUrl);
          if (imageResponse.ok) {
            const buffer = await imageResponse.arrayBuffer();
            archive.append(Buffer.from(buffer), {
              name: `${safeCategoryName}/${photo.fileName}`,
            });
            addedCount++;
          }
        } catch (err) {
          console.log(`Error adding photo ${photo.fileName}:`, err.message);
        }
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Toggle photo website visibility
 * @route   POST /api/photos/:id/toggle-website
 * @access  Admin, Sub-admin
 */
exports.toggleWebsite = async (req, res, next) => {
  try {
    const result = await photoService.toggleWebsite(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get classes and students for teacher to select target audience
 * @route   GET /api/photos/target-audience
 * @access  Teacher, Admin
 */
exports.getTargetAudience = async (req, res, next) => {
  try {
    const data = await photoService.getTargetAudience();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};