const { body } = require("express-validator");

/**
 * Register device token validators
 */
exports.registerDeviceTokenValidation = [
  body("token")
    .notEmpty()
    .withMessage("Device token is required")
    .isLength({ min: 10 })
    .withMessage("Device token is too short"),
  body("deviceType")
    .notEmpty()
    .withMessage("Device type is required")
    .isIn(["android", "ios", "web"])
    .withMessage("Device type must be android, ios, or web"),
  body("deviceName")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Device name cannot exceed 100 characters"),
];

/**
 * Remove device token validators
 */
exports.removeDeviceTokenValidation = [
  body("token").notEmpty().withMessage("Device token is required"),
];

/**
 * Send notification to single user (Admin only)
 */
exports.sendToSingleUserValidation = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID format"),
  body("title")
    .notEmpty()
    .withMessage("Notification title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("body")
    .notEmpty()
    .withMessage("Notification body is required")
    .isLength({ max: 500 })
    .withMessage("Body cannot exceed 500 characters"),
  body("data").optional().isObject().withMessage("Data must be an object"),
];

/**
 * Send notification to multiple users (Admin only)
 */
exports.sendToMultipleUsersValidation = [
  body("userIds")
    .notEmpty()
    .withMessage("User IDs array is required")
    .isArray({ min: 1 })
    .withMessage("User IDs must be a non-empty array"),
  body("userIds.*")
    .isMongoId()
    .withMessage("Each user ID must be a valid MongoDB ObjectId"),
  body("title")
    .notEmpty()
    .withMessage("Notification title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("body")
    .notEmpty()
    .withMessage("Notification body is required")
    .isLength({ max: 500 })
    .withMessage("Body cannot exceed 500 characters"),
];

/**
 * Send broadcast notification (Admin only)
 */
exports.sendBroadcastValidation = [
  body("title")
    .notEmpty()
    .withMessage("Notification title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("body")
    .notEmpty()
    .withMessage("Notification body is required")
    .isLength({ max: 500 })
    .withMessage("Body cannot exceed 500 characters"),
];

/**
 * Send test notification validators
 */
exports.sendTestNotificationValidation = [
  body("token")
    .optional()
    .isLength({ min: 10 })
    .withMessage("FCM token is too short (if provided)"),
  body("title")
    .notEmpty()
    .withMessage("Notification title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("body")
    .notEmpty()
    .withMessage("Notification body is required")
    .isLength({ max: 500 })
    .withMessage("Body cannot exceed 500 characters"),
  body("data")
    .optional()
    .isObject()
    .withMessage("Data must be an object if provided"),
  body("sendToSelf")
    .optional()
    .isBoolean()
    .withMessage("sendToSelf must be a boolean"),
];
