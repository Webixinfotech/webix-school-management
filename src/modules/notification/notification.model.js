const mongoose = require("mongoose");

const DeviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    token: {
      type: String,
      required: [true, "Device token is required"],
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["android", "ios", "web"],
      required: [true, "Device type is required"],
    },
    deviceName: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound index for faster queries
DeviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });
DeviceTokenSchema.index({ token: 1 });
DeviceTokenSchema.index({ userId: 1, isActive: 1 });

/**
 * Notification Log Schema - stores sent notifications
 */
const NotificationLogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    body: {
      type: String,
      required: [true, "Notification body is required"],
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    targetTokens: [
      {
        type: String,
      },
    ],
    targetType: {
      type: String,
      enum: ["single", "multiple", "broadcast", "topic"],
      required: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["success", "partial", "failed"],
      default: "success",
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    responses: [
      {
        token: String,
        success: Boolean,
        error: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes for notification logs
NotificationLogSchema.index({ createdAt: -1 });
NotificationLogSchema.index({ sentBy: 1 });
NotificationLogSchema.index({ status: 1 });

module.exports = {
  DeviceToken: mongoose.model("DeviceToken", DeviceTokenSchema),
  NotificationLog: mongoose.model("NotificationLog", NotificationLogSchema),
};
