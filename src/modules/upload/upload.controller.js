const ErrorResponse = require("../../utils/errorResponse");
const s3Service = require("../../services/s3.service");
const User = require("../auth/user.model");

/**
 * @desc    Upload profile avatar
 * @route   POST /api/upload/avatar
 * @access  Private (all authenticated users)
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return next(new ErrorResponse("Please upload an image file", 400));
    }

    // Upload to S3
    const uploadResult = await s3Service.uploadToS3(
      req.file,
      "avatars",
      req.user._id.toString(),
      "avatar",
    );

    // Update user's avatar in database
    // Store both URL and S3 key for future deletion
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: uploadResult.url,
        avatarKey: uploadResult.key, // Store S3 key for cleanup
      },
      {
        new: true,
        runValidators: true,
        select: "-password",
      },
    );

    if (!updatedUser) {
      return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatarUrl: uploadResult.url,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload avatar via base64
 * @route   POST /api/upload/avatar/base64
 * @access  Private (all authenticated users)
 */
exports.uploadAvatarBase64 = async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return next(new ErrorResponse("Please provide base64 image data", 400));
    }

    // Upload base64 to S3
    const uploadResult = await s3Service.uploadBase64ToS3(
      image,
      "avatars",
      req.user._id.toString(),
      "avatar",
    );

    // Update user's avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: uploadResult.url,
        avatarKey: uploadResult.key,
      },
      {
        new: true,
        runValidators: true,
        select: "-password",
      },
    );

    if (!updatedUser) {
      return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatarUrl: uploadResult.url,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete avatar
 * @route   DELETE /api/upload/avatar
 * @access  Private (all authenticated users)
 */
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // If user has an avatar with S3 key, delete from S3
    if (user.avatarKey) {
      await s3Service.deleteFromS3(user.avatarKey);
    }

    // Remove avatar from database
    user.avatar = null;
    user.avatarKey = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get presigned URL for direct S3 upload
 * @route   GET /api/upload/presigned-url
 * @access  Private (all authenticated users)
 */
exports.getPresignedUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, folder } = req.query;

    if (!fileName || !fileType) {
      return next(
        new ErrorResponse("Please provide fileName and fileType", 400),
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(fileType)) {
      return next(new ErrorResponse("Invalid file type", 400));
    }

    // Determine folder based on query or default to 'uploads'
    const s3Folder = folder || "uploads";

    // Generate presigned URL
    const { uploadUrl, fileUrl, fileKey } =
      await s3Service.generatePresignedUrl(
        s3Folder,
        req.user._id.toString(),
        fileName,
        fileType,
      );

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        fileUrl,
        fileKey,
        method: "PUT",
        headers: {
          "Content-Type": fileType,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user avatar URL (after direct S3 upload)
 * @route   PUT /api/upload/avatar/url
 * @access  Private (all authenticated users)
 */
exports.updateAvatarUrl = async (req, res, next) => {
  try {
    const { fileUrl, fileKey } = req.body;

    if (!fileUrl && !fileKey) {
      return next(new ErrorResponse("Please provide fileUrl or fileKey", 400));
    }

    const avatarUrl = fileUrl || s3Service.getFileUrl(fileKey);
    const avatarKey = fileKey || fileUrl.split(".amazonaws.com/")[1];

    // Update user's avatar
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: avatarUrl,
        avatarKey: avatarKey,
      },
      {
        new: true,
        runValidators: true,
        select: "-password",
      },
    );

    if (!updatedUser) {
      return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        avatarUrl: updatedUser.avatar,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete file from S3 by key
 * @route   DELETE /api/upload/file/:key
 * @access  Private (Admin only)
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const { key } = req.params;

    if (!key) {
      return next(new ErrorResponse("Please provide file key", 400));
    }

    // Decode the key if it's URL-encoded
    const decodedKey = decodeURIComponent(key);

    // Delete from S3
    await s3Service.deleteFromS3(decodedKey);

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload single photo to S3
 * @route   POST /api/upload/photo
 * @access  Private (Admin, Sub-admin, Teacher)
 */
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse("Please upload an image file", 400));
    }

    // Upload to S3
    const uploadResult = await s3Service.uploadToS3(
      req.file,
      "photos",
      req.user._id.toString(),
      "photo",
    );

    res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype,
        originalName: uploadResult.originalName,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload multiple photos to S3
 * @route   POST /api/upload/photos/bulk
 * @access  Private (Admin, Sub-admin, Teacher)
 */
exports.uploadBulkPhotos = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(
        new ErrorResponse("Please upload at least one image file", 400),
      );
    }

    // Upload all files to S3
    const uploadPromises = req.files.map((file) =>
      s3Service.uploadToS3(file, "photos", req.user._id.toString(), "photo"),
    );

    const uploadResults = await Promise.all(uploadPromises);

    res.status(201).json({
      success: true,
      message: `${uploadResults.length} photos uploaded successfully`,
      count: uploadResults.length,
      data: uploadResults.map((result) => ({
        url: result.url,
        key: result.key,
        size: result.size,
        mimetype: result.mimetype,
        originalName: result.originalName,
      })),
    });
  } catch (err) {
    next(err);
  }
};
