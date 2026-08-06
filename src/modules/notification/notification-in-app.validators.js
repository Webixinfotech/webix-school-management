const { body, param, query } = require("express-validator");

/**
 * Create notification validators
 */
exports.createNotificationValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
  body("body")
    .notEmpty()
    .withMessage("Body is required")
    .isLength({ max: 2000 })
    .withMessage("Body cannot exceed 2000 characters"),
  body("type")
    .optional()
    .isIn([
      "general",
      "attendance",
      "fee",
      "holiday",
      "exam",
      "schedule",
      "announcement",
      "message",
      "birthday",
      "homework",
      "inventory",
    ])
    .withMessage("Invalid notification type"),
  body("targetType")
    .notEmpty()
    .withMessage("Target type is required")
    .isIn(["all", "role", "class", "specific"])
    .withMessage("Target type must be all, role, class, or specific"),
  body("targetRoles")
    .optional()
    .isArray()
    .withMessage("targetRoles must be an array"),
  body("targetRoles.*")
    .optional()
    .isIn(["teacher", "parent", "admin"])
    .withMessage("Invalid role in targetRoles"),
  body("targetClassIds")
    .optional()
    .isArray()
    .withMessage("targetClassIds must be an array"),
  body("targetClassIds.*")
    .optional()
    .isMongoId()
    .withMessage("Each targetClassId must be a valid MongoDB ObjectId"),
  body("targetUserIds")
    .optional()
    .isArray()
    .withMessage("targetUserIds must be an array"),
  body("targetUserIds.*")
    .optional()
    .isMongoId()
    .withMessage("Each targetUserId must be a valid MongoDB ObjectId"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("data")
    .optional()
    .isObject()
    .withMessage("Data must be an object"),
  body("link")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Link cannot exceed 500 characters"),
  body("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("expiresAt must be a valid date (ISO 8601)"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
  body("totalRecipients")
    .optional()
    .isInt({ min: 0 })
    .withMessage("totalRecipients must be a non-negative integer"),
];

/**
 * Mark multiple as read validation
 */
exports.markMultipleAsReadValidation = [
  body("notificationIds")
    .notEmpty()
    .withMessage("notificationIds array is required")
    .isArray({ min: 1 })
    .withMessage("notificationIds must be a non-empty array"),
  body("notificationIds.*")
    .isMongoId()
    .withMessage("Each notificationId must be a valid MongoDB ObjectId"),
];

/**
 * Bulk delete validation
 */
exports.bulkDeleteNotificationsValidation = [
  body("notificationIds")
    .notEmpty()
    .withMessage("notificationIds array is required")
    .isArray({ min: 1 })
    .withMessage("notificationIds must be a non-empty array"),
  body("notificationIds.*")
    .isMongoId()
    .withMessage("Each notificationId must be a valid MongoDB ObjectId"),
];

/**
 * Clear all notifications validation
 */
exports.clearAllNotificationsValidation = [
  query("type")
    .optional()
    .isIn([
      "general",
      "attendance",
      "fee",
      "holiday",
      "exam",
      "schedule",
      "announcement",
      "message",
      "birthday",
      "homework",
      "inventory",
    ])
    .withMessage("Invalid notification type filter"),
  query("targetType")
    .optional()
    .isIn(["all", "role", "class", "specific"])
    .withMessage("Invalid target type filter"),
];

/**
 * Notifications query params validation
 */
exports.notificationsQueryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("unreadOnly")
    .optional()
    .isBoolean()
    .withMessage("unreadOnly must be true or false"),
];

/**
 * Admin notifications query validators
 */
exports.adminNotificationsQueryValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("type")
    .optional()
    .isIn([
      "general",
      "attendance",
      "fee",
      "holiday",
      "exam",
      "schedule",
      "announcement",
      "message",
      "birthday",
      "homework",
      "inventory",
    ])
    .withMessage("Invalid notification type filter"),
  query("targetType")
    .optional()
    .isIn(["all", "role", "class", "specific"])
    .withMessage("Invalid target type filter"),
  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
];

/**
 * Param validators
 */
exports.notificationIdParamValidation = [
  param("id")
    .notEmpty()
    .withMessage("Notification ID is required")
    .isMongoId()
    .withMessage("Invalid Notification ID format"),
];
