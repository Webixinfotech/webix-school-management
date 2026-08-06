const NotificationService = require("./notification.service");
const ErrorResponse = require("../../utils/errorResponse");

/**
 * @desc    Register device token
 * @route   POST /api/notifications/register-device
 * @access  Private (All authenticated users)
 */
exports.registerDeviceToken = async (req, res, next) => {
  try {
    const { token, deviceType, deviceName } = req.body;

    if (!token || !deviceType) {
      return next(new ErrorResponse("Token and device type are required", 400));
    }

    if (!["android", "ios", "web"].includes(deviceType)) {
      return next(
        new ErrorResponse("Device type must be android, ios, or web", 400),
      );
    }

    const deviceToken = await NotificationService.registerDeviceToken(
      req.user.id,
      token,
      deviceType,
      deviceName || "",
    );

    res.status(201).json({
      success: true,
      message: "Device token registered successfully",
      data: deviceToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove device token (logout)
 * @route   POST /api/notifications/remove-device
 * @access  Private
 */
exports.removeDeviceToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new ErrorResponse("Token is required", 400));
    }

    const result = await NotificationService.removeDeviceToken(
      req.user.id,
      token,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send notification to single user
 * @route   POST /api/notifications/send-to-user
 * @access  Private (Admin only)
 */
exports.sendToSingleUser = async (req, res, next) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return next(
        new ErrorResponse("User ID, title, and body are required", 400),
      );
    }

    const result = await NotificationService.sendToSingleUser(
      userId,
      title,
      body,
      { ...data, sentBy: req.user.id },
    );

    res.status(200).json({
      success: true,
      message: "Notification sent successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send notification to multiple users
 * @route   POST /api/notifications/send-to-users
 * @access  Private (Admin only)
 */
exports.sendToMultipleUsers = async (req, res, next) => {
  try {
    const { userIds, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return next(new ErrorResponse("User IDs array is required", 400));
    }

    if (!title || !body) {
      return next(new ErrorResponse("Title and body are required", 400));
    }

    const result = await NotificationService.sendToMultipleUsers(
      userIds,
      title,
      body,
      { ...data, sentBy: req.user.id },
    );

    res.status(200).json({
      success: true,
      message: "Notifications sent successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send broadcast notification to all users
 * @route   POST /api/notifications/broadcast
 * @access  Private (Admin only)
 */
exports.sendBroadcast = async (req, res, next) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return next(new ErrorResponse("Title and body are required", 400));
    }

    const result = await NotificationService.sendBroadcast(title, body, {
      ...data,
      sentBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Broadcast sent successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notification logs
 * @route   GET /api/notifications/logs
 * @access  Private (Admin only)
 */
exports.getNotificationLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await NotificationService.getNotificationLogs(page, limit);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's registered devices
 * @route   GET /api/notifications/my-devices
 * @access  Private (All authenticated users)
 */
exports.getMyDevices = async (req, res, next) => {
  try {
    const result = await NotificationService.getUserDevices(req.user.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cleanup inactive tokens (Admin only)
 * @route   DELETE /api/notifications/cleanup
 * @access  Private (Admin only)
 */
exports.cleanupInactiveTokens = async (req, res, next) => {
  try {
    const { daysOld = 30 } = req.query;

    const result = await NotificationService.cleanupInactiveTokens(
      parseInt(daysOld),
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send test push notification (for testing FCM)
 * @route   POST /api/notifications/test-send
 * @access  Private (All authenticated users)
 * @body    { token, title, body, data }
 *
 * Usage: Send a test notification to verify FCM is working.
 * - Provide `token` to send to a specific FCM token (any user's device)
 * - Omit `token` to send to your own registered device tokens
 * - Can also use `sendToSelf: true` to send to all your registered devices
 */
exports.sendTestNotification = async (req, res, next) => {
  try {
    const {
      token,
      title,
      body: messageBody,
      data = {},
      sendToSelf = false,
    } = req.body;

    // Validate required fields
    if (!title || !messageBody) {
      return next(new ErrorResponse("Title and body are required", 400));
    }

    // Determine target tokens and targetType
    let targetTokens = [];
    let targetType = "single"; // Default to single

    if (token) {
      // Send to specific token provided
      targetTokens = [{ token, userId: "test-target", deviceType: "test" }];
      targetType = "single";
    } else if (sendToSelf) {
      // Send to user's own registered active devices
      const userDevices = await NotificationService.getUserDevices(req.user.id, {
        activeOnly: true,
      });
      if (userDevices.count === 0) {
        return next(
          new ErrorResponse(
            "No active device tokens registered for your account. Register a device first using /api/notifications/register-device",
            400,
          ),
        );
      }
      targetTokens = userDevices.data;
      targetType = targetTokens.length > 1 ? "multiple" : "single";
    } else {
      // Default: send to user's own active devices (backward compatible)
      const userDevices = await NotificationService.getUserDevices(req.user.id, {
        activeOnly: true,
      });
      if (userDevices.count === 0) {
        return next(
          new ErrorResponse(
            "No active device tokens registered. Either provide a `token` or set `sendToSelf: true`",
            400,
          ),
        );
      }
      targetTokens = userDevices.data;
      targetType = targetTokens.length > 1 ? "multiple" : "single";
    }

    // Send notification
    const result = await NotificationService._sendFirebaseMessage(
      targetTokens,
      title,
      messageBody,
      { ...data, test: true, sentBy: req.user.id, sentTo: token || "self" },
      targetType,
    );

    res.status(200).json({
      success: true,
      message: `Test notification sent to ${result.successCount} device(s)`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
