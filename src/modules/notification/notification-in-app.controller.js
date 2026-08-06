const InAppNotificationService = require("./notification-in-app.service");
const ErrorResponse = require("../../utils/errorResponse");

/**
  * @desc    Get my notifications (teacher/parent/admin)
  * @route   GET /api/notifications/my-notifications
  * @access  Private (Teacher, Parent, Admin)
  */
 exports.getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userRole = req.user.role;

    const result = await InAppNotificationService.getNotificationsForUser(
      req.user._id,
      userRole,
      { page: parseInt(page), limit: parseInt(limit), unreadOnly: unreadOnly === "true" },
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Get my unread notification count
  * @route   GET /api/notifications/unread-count
  * @access  Private (Teacher, Parent, Admin)
  */
 exports.getUnreadCount = async (req, res, next) => {
  try {
    const result = await InAppNotificationService.getUnreadCount(
      req.user._id,
      req.user.role,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Mark a single notification as read
  * @route   PUT /api/notifications/:id/read
  * @access  Private (Teacher, Parent, Admin)
  */
 exports.markAsRead = async (req, res, next) => {
  try {
    const result = await InAppNotificationService.markAsRead(req.params.id, req.user._id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Mark multiple notifications as read
  * @route   PUT /api/notifications/mark-read
  * @access  Private (Teacher, Parent, Admin)
  */
 exports.markMultipleAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return next(new ErrorResponse("notificationIds array is required", 400));
    }

    const result = await InAppNotificationService.markMultipleAsRead(
      notificationIds,
      req.user._id,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Mark all notifications as read
  * @route   PUT /api/notifications/mark-all-read
  * @access  Private (Teacher, Parent, Admin)
  */
 exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await InAppNotificationService.markAllAsRead(req.user._id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Get notification detail
  * @route   GET /api/notifications/:id
  * @access  Private (Teacher, Parent, Admin)
  */
 exports.getNotificationDetail = async (req, res, next) => {
  try {
    const result = await InAppNotificationService.getNotificationById(
      req.params.id,
      req.user._id,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create notification (Admin, Sub-admin)
 * @route   POST /api/notifications
 * @access  Private (Admin, Sub-admin)
 */
exports.createNotification = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      sender: req.user._id,
    };

    const notification = await InAppNotificationService.createNotification(payload);

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all notifications for admin
 * @route   GET /api/notifications
 * @access  Private (Admin, Sub-admin)
 */
exports.getAllNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, targetType, isActive } = req.query;

    const result = await InAppNotificationService.getAllNotifications({
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      targetType,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Delete notification (Admin only)
  * @route   DELETE /api/notifications/:id
  * @access  Private (Admin only)
  */
exports.deleteNotification = async (req, res, next) => {
  try {
    const result = await InAppNotificationService.deleteNotification(req.params.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Bulk delete selected notifications (Admin only)
  * @route   DELETE /api/notifications/bulk
  * @access  Private (Admin only)
  */
exports.bulkDeleteNotifications = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return next(new ErrorResponse("notificationIds array is required", 400));
    }

    const result = await InAppNotificationService.bulkDeleteNotifications(notificationIds);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Clear (delete) all notifications, optionally filtered by type/targetType (Admin only)
  * @route   DELETE /api/notifications/clear-all
  * @access  Private (Admin only)
  */
exports.clearAllNotifications = async (req, res, next) => {
  try {
    const { type, targetType } = req.query;

    const result = await InAppNotificationService.clearAllNotifications({ type, targetType });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Dismiss notification (Read + Hide from bar) - Teacher/Parent/Admin
  * @route   PUT /api/notifications/:id/dismiss
  * @access  Private (Teacher, Parent, Admin)
  */
exports.dismissNotification = async (req, res, next) => {
  try {
    const result = await InAppNotificationService.dismissNotification(
      req.params.id,
      req.user._id
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
  * @desc    Dismiss multiple notifications - Teacher/Parent/Admin
  * @route   PUT /api/notifications/dismiss-multiple
  * @access  Private (Teacher, Parent, Admin)
  */
exports.dismissMultipleNotifications = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return next(new ErrorResponse("notificationIds array is required", 400));
    }

    const result = await InAppNotificationService.dismissMultipleNotifications(
      notificationIds,
      req.user._id
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
