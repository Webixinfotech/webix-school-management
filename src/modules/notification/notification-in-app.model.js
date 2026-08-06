const mongoose = require("mongoose");

const InAppNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  body: {
    type: String,
    required: [true, "Body is required"],
    trim: true,
    maxlength: [2000, "Body cannot exceed 2000 characters"],
  },
  type: {
    type: String,
    enum: [
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
    ],
    default: "general",
  },
  targetType: {
    type: String,
    enum: ["all", "role", "class", "specific"],
    required: [true, "Target type is required"],
  },
  targetRoles: [
    {
      type: String,
      enum: ["teacher", "parent", "admin"],
    },
  ],
  targetClassIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  ],
  targetUserIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  sender: {
    // Optional: system-generated notifications (attendance, fee, enquiry, etc.)
    // have no human sender. Admin-composed notifications still set this from req.user.
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  link: {
    type: String,
    trim: true,
    maxlength: [500, "Link cannot exceed 500 characters"],
  },
  expiresAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  totalRecipients: {
    type: Number,
    default: 0,
  },
  readCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

InAppNotificationSchema.index({ targetType: 1, createdAt: -1 });
InAppNotificationSchema.index({ sender: 1, createdAt: -1 });
InAppNotificationSchema.index({ targetRoles: 1 });
InAppNotificationSchema.index({ isActive: 1, createdAt: -1 });
InAppNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const NotificationReadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User is required"],
    index: true,
  },
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InAppNotification",
    required: [true, "Notification is required"],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isDismissed: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

NotificationReadSchema.index({ userId: 1, notification: 1 }, { unique: true });
NotificationReadSchema.index({ userId: 1, isRead: 1 });
NotificationReadSchema.index({ notification: 1 });

module.exports = {
  InAppNotification: mongoose.model("InAppNotification", InAppNotificationSchema),
  NotificationRead: mongoose.model("NotificationRead", NotificationReadSchema),
};
