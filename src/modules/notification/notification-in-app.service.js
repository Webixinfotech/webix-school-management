const { InAppNotification, NotificationRead } = require("./notification-in-app.model");
const User = require("../auth/user.model");
const Teacher = require("../teacher/teacher.model");
const Parent = require("../shared/parent.model");
const Class = require("../class/class.model");
const Student = require("../student/student.model");
const ErrorResponse = require("../../utils/errorResponse");
const logger = require("../../config/logger");

class InAppNotificationService {
  /**
   * Create an in-app notification
   * Automatically creates NotificationRead records for all matching recipients
   */
  async createNotification(payload) {
    try {
      const {
        title,
        body,
        type = "general",
        targetType,
        targetRoles = [],
        targetClassIds = [],
        targetUserIds = [],
        sender = null,
        priority = "medium",
        data = {},
        link = "",
        expiresAt,
        isActive = true,
        totalRecipients = 0,
      } = payload;

      if (!title || !body || !targetType) {
        throw new ErrorResponse("Title, body, and targetType are required", 400);
      }

      const notification = await InAppNotification.create({
        title,
        body,
        type,
        targetType,
        targetRoles,
        targetClassIds,
        targetUserIds,
        sender,
        priority,
        data,
        link,
        expiresAt,
        isActive,
        totalRecipients,
      });

      return await this._populateNotification(notification);
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Get notifications for a specific user (teacher, parent, or admin)
   * Returns only notifications visible to the user based on target rules
   */
  async getNotificationsForUser(userId, userRole, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      const user = await User.findById(userId).select("_id role");
      if (!user) throw new ErrorResponse("User not found", 404);

      const matchConditions = {
        isActive: true,
        $or: [
          { targetType: "all" },
          { targetType: "specific", targetUserIds: user._id },
        ],
      };

      if (userRole === "teacher") {
        const teacher = await Teacher.findOne({ userId: user._id }).select("_id classIds");
        if (teacher && teacher.classIds && teacher.classIds.length > 0) {
          matchConditions.$or.push({
            targetType: "class",
            targetClassIds: { $in: teacher.classIds },
          });
        }
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: "teacher",
        });
      }

      if (userRole === "parent") {
        const parent = await Parent.findOne({ userId: user._id }).select("_id children");
        if (parent && parent.children && parent.children.length > 0) {
          const studentClassIds = await Student.find(
            { _id: { $in: parent.children } },
            "classIds",
          );
          const classIds = studentClassIds.flatMap((s) => s.classIds || []);
          if (classIds.length > 0) {
            matchConditions.$or.push({
              targetType: "class",
              targetClassIds: { $in: classIds },
            });
          }
        }
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: "parent",
        });
      }

      if (userRole === "admin") {
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: { $in: ["admin"] },
        });
      }

      const dismissedIds = await NotificationRead.find({
        userId: user._id,
        isDismissed: true,
      }).distinct("notification");

      matchConditions._id = { $nin: dismissedIds };

      const [notificationsData, totalCount] = await Promise.all([
        InAppNotification.find(matchConditions)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("sender", "name email role avatar"),
        InAppNotification.countDocuments(matchConditions),
      ]);

      const notificationIds = notificationsData.map((n) => n._id);

      const readRecords = await NotificationRead.find({
        notification: { $in: notificationIds },
        userId: user._id,
      });

      const readMap = {};
      readRecords.forEach((r) => {
        readMap[r.notification.toString()] = r;
      });

      const notifications = notificationsData.map((n) => {
        const readRecord = readMap[n._id.toString()];
        const notif = n.toObject();
        notif.isRead = readRecord?.isRead === true;
        notif.isDismissed = readRecord?.isDismissed === true;
        notif.readAt = readRecord ? readRecord.readAt : null;
        return notif;
      });

      return {
        success: true,
        data: notifications,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Error getting notifications for user:", error);
      throw error;
    }
  }

  /**
   * Mark a notification as read for a user
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await InAppNotification.findById(notificationId);
      if (!notification) {
        throw new ErrorResponse("Notification not found", 404);
      }

      const readRecord = await NotificationRead.findOneAndUpdate(
        { notification: notificationId, userId },
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true, upsert: true },
      );

      const readCount = await NotificationRead.countDocuments({
        notification: notificationId,
        isRead: true,
      });

      await InAppNotification.findByIdAndUpdate(notificationId, {
        readCount,
      });

      return {
        success: true,
        message: "Notification marked as read",
        data: readRecord,
      };
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds, userId) {
    try {
      const validNotifications = await InAppNotification.find({
        _id: { $in: notificationIds },
        isActive: true,
      });

      if (validNotifications.length === 0) {
        throw new ErrorResponse("No valid notifications found", 404);
      }

      const bulkOps = notificationIds.map((nid) => ({
        updateOne: {
          filter: { notification: nid, userId },
          update: {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await NotificationRead.bulkWrite(bulkOps);
      }

      for (const nid of notificationIds) {
        const readCount = await NotificationRead.countDocuments({
          notification: nid,
          isRead: true,
        });
        await InAppNotification.findByIdAndUpdate(nid, { readCount });
      }

      return {
        success: true,
        message: `${notificationIds.length} notifications marked as read`,
      };
    } catch (error) {
      logger.error("Error marking multiple notifications as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new ErrorResponse("User not found", 404);

      let matchConditions = {
        isActive: true,
        $or: [{ targetType: "all" }, { targetType: "specific", targetUserIds: user._id }],
      };

      if (user.role === "teacher") {
        const teacher = await Teacher.findOne({ userId: user._id }).select("_id classIds");
        if (teacher && teacher.classIds && teacher.classIds.length > 0) {
          matchConditions.$or.push({
            targetType: "class",
            targetClassIds: { $in: teacher.classIds },
          });
        }
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: "teacher",
        });
      }

      if (user.role === "parent") {
        const parent = await Parent.findOne({ userId: user._id }).select("_id children");
        if (parent && parent.children && parent.children.length > 0) {
          const studentClassIds = await Student.find(
            { _id: { $in: parent.children } },
            "classIds",
          );
          const classIds = studentClassIds.flatMap((s) => s.classIds || []);
          if (classIds.length > 0) {
            matchConditions.$or.push({
              targetType: "class",
              targetClassIds: { $in: classIds },
            });
          }
        }
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: "parent",
        });
      }

      if (user.role === "admin") {
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: { $in: ["admin"] },
        });
      }

      const notifications = await InAppNotification.find(matchConditions).select("_id");
      const notificationIds = notifications.map((n) => n._id);

      const existingReads = await NotificationRead.find({
        userId: user._id,
        notification: { $in: notificationIds },
        isRead: true,
      });

      const alreadyReadIds = existingReads.map((r) => r.notification.toString());
      const toMarkRead = notificationIds.filter((id) => !alreadyReadIds.includes(id.toString()));

      if (toMarkRead.length > 0) {
        const bulkOps = toMarkRead.map((nid) => ({
          updateOne: {
            filter: { notification: nid, userId: user._id },
            update: {
              $set: {
                isRead: true,
                readAt: new Date(),
              },
            },
            upsert: true,
          },
        }));

        await NotificationRead.bulkWrite(bulkOps);

        for (const nid of toMarkRead) {
          await InAppNotification.findByIdAndUpdate(nid, {
            $inc: { readCount: 1 },
          });
        }
      }

      return {
        success: true,
        message: `${toMarkRead.length} notifications marked as read`,
        markedCount: toMarkRead.length,
      };
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId, userRole) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new ErrorResponse("User not found", 404);

      let matchConditions = {
        isActive: true,
        $or: [{ targetType: "all" }, { targetType: "specific", targetUserIds: user._id }],
      };

      if (userRole === "teacher") {
        const teacher = await Teacher.findOne({ userId: user._id }).select("_id classIds");
        if (teacher && teacher.classIds && teacher.classIds.length > 0) {
          matchConditions.$or.push({
            targetType: "class",
            targetClassIds: { $in: teacher.classIds },
          });
        }
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: "teacher",
        });
      }

      if (userRole === "parent") {
        const parent = await Parent.findOne({ userId: user._id }).select("_id children");
        if (parent && parent.children && parent.children.length > 0) {
          const studentClassIds = await Student.find(
            { _id: { $in: parent.children } },
            "classIds",
          );
          const classIds = studentClassIds.flatMap((s) => s.classIds || []);
          if (classIds.length > 0) {
            matchConditions.$or.push({
              targetType: "class",
              targetClassIds: { $in: classIds },
            });
          }
        }
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: "parent",
        });
      }

      if (userRole === "admin") {
        matchConditions.$or.push({
          targetType: "role",
          targetRoles: { $in: ["admin"] },
        });
      }

      const dismissedIds = await NotificationRead.find({
        userId: user._id,
        isDismissed: true,
      }).distinct("notification");

      matchConditions._id = { $nin: dismissedIds };

      const notifications = await InAppNotification.find(matchConditions).select("_id");
      const notificationIds = notifications.map((n) => n._id);

      const readCount = await NotificationRead.countDocuments({
        notification: { $in: notificationIds },
        userId: user._id,
        isRead: true,
      });

      const unreadCount = notificationIds.length - readCount;

      return {
        success: true,
        data: { unreadCount },
      };
    } catch (error) {
      logger.error("Error getting unread count:", error);
      throw error;
    }
  }

  /**
   * Get a single notification with read status
   */
  async getNotificationById(notificationId, userId) {
    try {
      const notification = await InAppNotification.findById(notificationId);
      if (!notification) {
        throw new ErrorResponse("Notification not found", 404);
      }

      const populatedNotification = await this._populateNotification(notification);

      const readRecord = await NotificationRead.findOne({
        notification: notificationId,
        userId,
      });

      const result = populatedNotification.toObject();
      result.isRead = readRecord?.isRead === true;
      result.isDismissed = readRecord?.isDismissed === true;
      result.readAt = readRecord ? readRecord.readAt : null;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error("Error getting notification by id:", error);
      throw error;
    }
  }

  async dismissNotification(notificationId, userId) {
    try {
      const notification = await InAppNotification.findById(notificationId);
      if (!notification) {
        throw new ErrorResponse("Notification not found", 404);
      }

      const readRecord = await NotificationRead.findOneAndUpdate(
        { notification: notificationId, userId },
        {
          isRead: true,
          readAt: new Date(),
          isDismissed: true,
        },
        { new: true, upsert: true }
      );

      return {
        success: true,
        message: "Notification dismissed successfully",
        data: readRecord,
      };
    } catch (error) {
      logger.error("Error dismissing notification:", error);
      throw error;
    }
  }

  async dismissMultipleNotifications(notificationIds, userId) {
    try {
      const validNotifications = await InAppNotification.find({
        _id: { $in: notificationIds },
        isActive: true,
      });

      if (validNotifications.length === 0) {
        throw new ErrorResponse("No valid notifications found", 404);
      }

      const bulkOps = notificationIds.map((nid) => ({
        updateOne: {
          filter: { notification: nid, userId },
          update: {
            $set: {
              isRead: true,
              readAt: new Date(),
              isDismissed: true,
            },
          },
          upsert: true,
        },
      }));

      await NotificationRead.bulkWrite(bulkOps);

      return {
        success: true,
        message: `${notificationIds.length} notifications dismissed successfully`,
      };
    } catch (error) {
      logger.error("Error dismissing multiple notifications:", error);
      throw error;
    }
  }

  /**
   * Delete a notification (admin only)
   */
  async deleteNotification(notificationId) {
    try {
      const notification = await InAppNotification.findById(notificationId);
      if (!notification) {
        throw new ErrorResponse("Notification not found", 404);
      }

      await InAppNotification.findByIdAndUpdate(notificationId, { isActive: false });

      return {
        success: true,
        message: "Notification deleted successfully",
      };
    } catch (error) {
      logger.error("Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Bulk delete selected notifications (admin only, soft delete)
   */
  async bulkDeleteNotifications(notificationIds) {
    try {
      const result = await InAppNotification.updateMany(
        { _id: { $in: notificationIds } },
        { isActive: false },
      );

      if (result.matchedCount === 0) {
        throw new ErrorResponse("No valid notifications found", 404);
      }

      return {
        success: true,
        message: `${result.modifiedCount} notifications deleted successfully`,
        deletedCount: result.modifiedCount,
      };
    } catch (error) {
      logger.error("Error bulk deleting notifications:", error);
      throw error;
    }
  }

  /**
   * Clear (soft delete) all notifications, optionally filtered by type/targetType (admin only)
   */
  async clearAllNotifications(filters = {}) {
    try {
      const { type, targetType } = filters;

      const query = { isActive: true };
      if (type) query.type = type;
      if (targetType) query.targetType = targetType;

      const result = await InAppNotification.updateMany(query, { isActive: false });

      return {
        success: true,
        message: `${result.modifiedCount} notifications cleared successfully`,
        clearedCount: result.modifiedCount,
      };
    } catch (error) {
      logger.error("Error clearing all notifications:", error);
      throw error;
    }
  }

  /**
   * Helper: populate notification fields
   */
  async _populateNotification(notification) {
    return await notification.populate([
      { path: "sender", select: "name email role avatar" },
      { path: "targetRoles" },
      { path: "targetClassIds", select: "name section" },
      { path: "targetUserIds", select: "name email role" },
    ]);
  }

  /**
   * Get all notifications for admin (listing)
   */
  async getAllNotifications(options = {}) {
    try {
      const { page = 1, limit = 20, type, targetType, isActive } = options;
      const skip = (page - 1) * limit;

      const query = {};
      if (type) query.type = type;
      if (targetType) query.targetType = targetType;
      // Default to active-only so deleted (isActive:false) notifications don't
      // linger in the admin list; pass isActive explicitly to see deleted ones.
      query.isActive = isActive !== undefined ? isActive : true;

      const [notifications, total] = await Promise.all([
        InAppNotification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("sender", "name email role"),
        InAppNotification.countDocuments(query),
      ]);

      return {
        success: true,
        data: notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error getting all notifications:", error);
      throw error;
    }
  }
}

module.exports = new InAppNotificationService();
