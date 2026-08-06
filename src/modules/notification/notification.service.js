const { DeviceToken, NotificationLog } = require("./notification.model");
const { getMessaging } = require("../../config/firebase");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");
const mongoose = require("mongoose");
const InAppNotificationService = require("./notification-in-app.service");

// InAppNotification.type only accepts this fixed set — map granular system
// event keys (used in FCM `data.type`) down to the closest broad category.
const VALID_IN_APP_TYPES = [
  "general", "attendance", "fee", "holiday", "exam", "schedule",
  "announcement", "message", "birthday", "homework", "inventory",
];
const EVENT_TYPE_CATEGORY = {
  invoice_generated: "fee",
  payment_received: "fee",
  flexi_hours_deduction: "attendance",
  flexi_hours_deduction_auto: "attendance",
  admin_auto_checkout_summary: "attendance",
  center_checkin: "attendance",
  new_enquiry: "message",
  enquiry_status_update: "message",
  daily_report: "general",
  health_concern: "general",
};

class NotificationService {
  /**
   * Register or update device token
   */
  async registerDeviceToken(userId, token, deviceType, deviceName = "") {
    try {
      // Check if token already exists for this user
      let deviceToken = await DeviceToken.findOne({ userId, token });

      if (deviceToken) {
        // Update existing token
        deviceToken.deviceType = deviceType;
        deviceToken.deviceName = deviceName;
        deviceToken.isActive = true;
        deviceToken.lastUsed = Date.now();
        await deviceToken.save();
        logger.info(`Device token updated for user ${userId}`);
      } else {
        // Check if token exists for another user (security check)
        const existingToken = await DeviceToken.findOne({ token });
        if (existingToken) {
          // Token belongs to another user, create new one
          logger.warn(
            `Token ${token.substring(0, 20)}... already in use by another user`,
          );
        }

        // Create new token
        deviceToken = await DeviceToken.create({
          userId,
          token,
          deviceType,
          deviceName,
          isActive: true,
          lastUsed: Date.now(),
        });
        logger.info(`Device token registered for user ${userId}`);
      }

      return deviceToken;
    } catch (error) {
      // Handle duplicate key error gracefully
      if (error.code === 11000) {
        logger.warn(`Duplicate token registration attempt for user ${userId}`);
        return await DeviceToken.findOne({ userId, token });
      }

      logger.error("Error registering device token:", error);
      throw new ErrorResponse("Failed to register device token", 500);
    }
  }

  /**
   * Internal method to send notification via Firebase
   */
  async _sendFirebaseMessage(deviceTokens, title, body, data = {}, targetType) {
    logger.info("Firebase push notifications are disabled locally. Mocking success.");
    return {
      success: true,
      successCount: deviceTokens ? deviceTokens.length : 0,
      failureCount: 0,
      responses: [],
    };
  }

  /**
   * Send notification to a single user
   */
  async sendToSingleUser(userId, title, body, data = {}) {
    console.log("Sending notification to user:", userId, title);

    try {
      // Validate userId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ErrorResponse("Invalid user ID format", 400);
      }

      // Get active device tokens for the user
      const deviceTokens = await DeviceToken.find({
        userId,
        isActive: true,
      });

      console.log(
        `Found ${deviceTokens.length} active device tokens for user ${userId}`,
      );

      if (deviceTokens.length === 0) {
        logger.warn(`No device tokens found for user ${userId}`);
        return {
          success: false,
          message: "No device tokens found for this user",
        };
      }

      return await this._sendFirebaseMessage(
        deviceTokens,
        title,
        body,
        data,
        "single",
      );

      console.log("Notification send result:", result);
    } catch (error) {
      logger.error("Error sending notification:", error);
      throw new ErrorResponse(
        error.message || "Failed to send notification",
        500,
      );
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(userIds, title, body, data = {}) {
    try {
      // Validate all userIds
      for (const userId of userIds) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new ErrorResponse(`Invalid user ID format: ${userId}`, 400);
        }
      }

      // Get all active device tokens for the users
      const deviceTokens = await DeviceToken.find({
        userId: { $in: userIds },
        isActive: true,
      });

      if (deviceTokens.length === 0) {
        logger.warn("No device tokens found for the provided users");
        return {
          success: false,
          message: "No device tokens found for the provided users",
        };
      }

      return await this._sendFirebaseMessage(
        deviceTokens,
        title,
        body,
        data,
        "multiple",
      );
    } catch (error) {
      logger.error("Error sending notifications:", error);
      throw new ErrorResponse(
        error.message || "Failed to send notifications",
        500,
      );
    }
  }

  /**
   * Resolve a system event's `data.type` down to a category InAppNotification.type accepts
   */
  _resolveInAppType(data = {}) {
    const raw = data.type;
    if (raw && VALID_IN_APP_TYPES.includes(raw)) return raw;
    return EVENT_TYPE_CATEGORY[raw] || "general";
  }

  /**
   * Send a system-triggered notification to one user: persists it as an
   * in-app notification (so it shows up in the bell/"My Notifications" list)
   * AND sends the FCM push. Use this instead of sendToSingleUser for any
   * automatic/business-event notification (attendance, fee, enquiry, etc).
   * Admin-composed notifications keep using sendToSingleUser directly since
   * the in-app record is already created explicitly before the push goes out.
   */
  async notifyUser(userId, title, body, data = {}, options = {}) {
    try {
      await InAppNotificationService.createNotification({
        title,
        body,
        type: this._resolveInAppType(data),
        targetType: "specific",
        targetUserIds: [userId],
        priority: options.priority || "medium",
        data,
        link: options.link || "",
      });
    } catch (err) {
      logger.error(
        `Failed to create in-app notification for user ${userId}: ${err.message}`,
      );
    }

    return this.sendToSingleUser(userId, title, body, data);
  }

  /**
   * Same as notifyUser, but for a batch of recipients (e.g. all admins).
   */
  async notifyUsers(userIds, title, body, data = {}, options = {}) {
    try {
      await InAppNotificationService.createNotification({
        title,
        body,
        type: this._resolveInAppType(data),
        targetType: "specific",
        targetUserIds: userIds,
        priority: options.priority || "medium",
        data,
        link: options.link || "",
      });
    } catch (err) {
      logger.error(
        `Failed to create in-app notification for users: ${err.message}`,
      );
    }

    return this.sendToMultipleUsers(userIds, title, body, data);
  }

  /**
   * Send broadcast notification to all users
   */
  async sendBroadcast(title, body, data = {}) {
    console.log("Sending broadcast notification:", title);

    try {
      // Get all active device tokens
      const deviceTokens = await DeviceToken.find({ isActive: true });

      if (deviceTokens.length === 0) {
        logger.warn("No active device tokens found");
        return {
          success: false,
          message: "No active device tokens found",
        };
      }

      // Warn if broadcasting to large number of devices
      if (deviceTokens.length > 500) {
        logger.warn(
          `Broadcasting to ${deviceTokens.length} devices. This may take a while.`,
        );
      }

      console.log(`Broadcasting to ${deviceTokens.length} devices`);

      return await this._sendFirebaseMessage(
        deviceTokens,
        title,
        body,
        data,
        "broadcast",
      );
    } catch (error) {
      logger.error("Error sending broadcast notification:", error);
      throw new ErrorResponse(
        error.message || "Failed to send broadcast notification",
        500,
      );
    }
  }

  /**
   * Remove device token (when user logs out)
   */
  async removeDeviceToken(userId, token) {
    try {
      const result = await DeviceToken.updateOne(
        { userId, token },
        { isActive: false },
      );

      if (result.matchedCount === 0) {
        throw new ErrorResponse("Device token not found", 404);
      }

      logger.info(`Device token removed for user ${userId}`);
      return { success: true, message: "Device token removed successfully" };
    } catch (error) {
      logger.error("Error removing device token:", error);
      throw new ErrorResponse("Failed to remove device token", 500);
    }
  }

  /**
   * Get notification logs
   */
  async getNotificationLogs(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        NotificationLog.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("sentBy", "name email role"),
        NotificationLog.countDocuments(),
      ]);

      return {
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error getting notification logs:", error);
      throw new ErrorResponse("Failed to get notification logs", 500);
    }
  }

  /**
   * Get user's registered devices
   */
  async getUserDevices(userId, options = {}) {
    try {
      const query = { userId };
      if (options.activeOnly) {
        query.isActive = true;
      }

      const devices = await DeviceToken.find(query).select("-__v");
      return {
        success: true,
        count: devices.length,
        data: devices,
      };
    } catch (error) {
      logger.error("Error getting user devices:", error);
      throw new ErrorResponse("Failed to get user devices", 500);
    }
  }

  /**
   * Send notification directly to an array of FCM tokens
   */
  async sendToMultipleDevices(tokens, title, body, data = {}) {
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return {
        success: false,
        message: "No tokens provided",
      };
    }

    const deviceTokens = tokens.map((token) => ({ token }));
    return await this._sendFirebaseMessage(
      deviceTokens,
      title,
      body,
      data,
      "multiple",
    );
  }

  /**
   * Cleanup inactive tokens (maintenance utility)
   */
  async cleanupInactiveTokens(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await DeviceToken.deleteMany({
        isActive: false,
        lastUsed: { $lt: cutoffDate },
      });

      logger.info(
        `Cleaned up ${result.deletedCount} inactive tokens older than ${daysOld} days`,
      );
      return {
        success: true,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      logger.error("Error cleaning up inactive tokens:", error);
      throw new ErrorResponse("Failed to cleanup inactive tokens", 500);
    }
  }

  /**
   * Send attendance notification to parent when attendance is marked.
   * Persists an in-app notification and sends the FCM push (see notifyUser).
   *
   * @param {ObjectId} studentId
   * @param {ObjectId} parentUserId
   * @param {string} status - 'Present' | 'Absent' | 'Late'
   * @param {string} dateKey - 'YYYY-MM-DD'
   * @param {string} studentName
   */
  async sendAttendanceNotification(
    studentId,
    parentUserId,
    status,
    dateKey,
    studentName,
  ) {
    try {
      let title, body;

      if (status === "Present") {
        title = "✅ Attendance Marked";
        body = `${studentName} ki attendance ${dateKey} ko mark ho gayi - Status: Present`;
      } else if (status === "Absent") {
        title = "⚠️ Absence Alert";
        body = `${studentName} aaj (${dateKey}) class mein absent hai`;
      } else {
        title = "🕐 Late Attendance";
        body = `${studentName} aaj (${dateKey}) class mein late aaya`;
      }

      const data = {
        type: "attendance",
        studentId: String(studentId),
        status,
        date: dateKey,
      };

      await this.notifyUser(String(parentUserId), title, body, data);

      logger.info(
        `Attendance notification sent to parent ${parentUserId} for student ${studentId}`,
      );
    } catch (err) {
      // Notification failure should NOT block attendance marking
      logger.error("Failed to send attendance notification:", err.message);
    }
  }

  /**
   * Helper method to flatten nested data for FCM
   * FCM data must be flat (no nested objects)
   */
  flattenData(data) {
    const flattened = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip sentBy as it's stored separately in log
      if (key === "sentBy") continue;

      if (typeof value === "object" && value !== null) {
        flattened[key] = JSON.stringify(value);
      } else {
        flattened[key] = String(value);
      }
    }

    return flattened;
  }
}

module.exports = new NotificationService();
