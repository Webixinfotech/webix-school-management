const express = require("express");
const router = express.Router();

// Existing FCM push notification controller
const {
  registerDeviceToken,
  removeDeviceToken,
  sendToSingleUser,
  sendToMultipleUsers,
  sendBroadcast,
  getNotificationLogs,
  getMyDevices,
  cleanupInactiveTokens,
  sendTestNotification,
} = require("./notification.controller");

// In-app notification controller
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  getNotificationDetail,
  createNotification,
  getAllNotifications,
  deleteNotification,
  bulkDeleteNotifications,
  clearAllNotifications,
  dismissNotification,
  dismissMultipleNotifications,
} = require("./notification-in-app.controller");

const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const {
  registerDeviceTokenValidation,
  removeDeviceTokenValidation,
  sendToSingleUserValidation,
  sendToMultipleUsersValidation,
  sendBroadcastValidation,
  sendTestNotificationValidation,
} = require("./notification.validators");
const {
  createNotificationValidation,
  markMultipleAsReadValidation,
  notificationsQueryValidation,
  adminNotificationsQueryValidation,
  notificationIdParamValidation,
  bulkDeleteNotificationsValidation,
  clearAllNotificationsValidation,
} = require("./notification-in-app.validators");

// All routes require authentication
router.use(authGuard);

// ── FCM Push Notification Routes ──────────────────────────────

router.post(
  "/register-device",
  authGuard,
  registerDeviceTokenValidation,
  validate,
  registerDeviceToken,
);
router.post(
  "/remove-device",
  authGuard,
  removeDeviceTokenValidation,
  validate,
  removeDeviceToken,
);
router.get("/my-devices", authGuard, getMyDevices);

router.post(
  "/send-to-user",
  authGuard,
  roleGuard("admin"),
  sendToSingleUserValidation,
  validate,
  sendToSingleUser,
);
router.post(
  "/send-to-users",
  authGuard,
  roleGuard("admin"),
  sendToMultipleUsersValidation,
  validate,
  sendToMultipleUsers,
);
router.post(
  "/broadcast",
  authGuard,
  roleGuard("admin"),
  sendBroadcastValidation,
  validate,
  sendBroadcast,
);
router.get("/logs", authGuard, roleGuard("admin"), getNotificationLogs);
router.delete("/cleanup", authGuard, roleGuard("admin"), cleanupInactiveTokens);

router.post(
  "/test-send",
  authGuard,
  sendTestNotificationValidation,
  validate,
  sendTestNotification,
);

// ── In-App Notification Routes (Teacher, Parent, Admin Dashboard) ────

// GET /api/notifications/my-notifications
router.get(
  "/my-notifications",
  authGuard,
  roleGuard("teacher", "parent", "admin"),
  notificationsQueryValidation,
  validate,
  getMyNotifications,
);

// GET /api/notifications/unread-count
router.get(
  "/unread-count",
  authGuard,
  roleGuard("teacher", "parent", "admin"),
  getUnreadCount,
);

// PUT /api/notifications/mark-all-read
router.put(
  "/mark-all-read",
  authGuard,
  roleGuard("teacher", "parent", "admin"),
  markAllAsRead,
);

// PUT /api/notifications/mark-read
router.put(
  "/mark-read",
  authGuard,
  roleGuard("teacher", "parent", "admin"),
  markMultipleAsReadValidation,
  validate,
  markMultipleAsRead,
);

// PUT /api/notifications/:id/read
router.put(
  "/:id/read",
  authGuard,
  roleGuard("teacher", "parent", "admin"),
  notificationIdParamValidation,
  validate,
  markAsRead,
);

// GET /api/notifications/:id
router.get(
  "/:id",
  authGuard,
  roleGuard("teacher", "parent", "admin"),
  notificationIdParamValidation,
  validate,
  getNotificationDetail,
);

// PUT /api/notifications/:id/dismiss
router.put(
  "/:id/dismiss",
  authGuard,
  roleGuard("teacher", "parent", "admin"),
  notificationIdParamValidation,
  validate,
  dismissNotification,
);

// PUT /api/notifications/dismiss-multiple
router.put(
  "/dismiss-multiple",
  authGuard,
  roleGuard("teacher", "parent", "admin"),
  markMultipleAsReadValidation,
  validate,
  dismissMultipleNotifications,
);

// ── Admin In-App Notification Management ──────────────────────

// POST /api/notifications
router.post(
  "/",
  authGuard,
  roleGuard("admin"),
  createNotificationValidation,
  validate,
  createNotification,
);

// GET /api/notifications (admin listing)
router.get(
  "/",
  authGuard,
  roleGuard("admin"),
  adminNotificationsQueryValidation,
  validate,
  getAllNotifications,
);

// DELETE /api/notifications/bulk (admin) — delete selected notifications
// NOTE: must be declared before "/:id" so "bulk" isn't captured as an id param
router.delete(
  "/bulk",
  authGuard,
  roleGuard("admin"),
  bulkDeleteNotificationsValidation,
  validate,
  bulkDeleteNotifications,
);

// DELETE /api/notifications/clear-all (admin) — delete all (optionally filtered) notifications
// NOTE: must be declared before "/:id" so "clear-all" isn't captured as an id param
router.delete(
  "/clear-all",
  authGuard,
  roleGuard("admin"),
  clearAllNotificationsValidation,
  validate,
  clearAllNotifications,
);

// DELETE /api/notifications/:id (admin)
router.delete(
  "/:id",
  authGuard,
  roleGuard("admin"),
  notificationIdParamValidation,
  validate,
  deleteNotification,
);

module.exports = router;
