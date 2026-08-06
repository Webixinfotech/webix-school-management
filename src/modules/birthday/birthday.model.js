/**
 * Birthday Module - Models
 *
 * NEW COLLECTIONS (non-destructive — do NOT modify existing tables):
 *   1. BirthdayNotificationLog  — tracks sent birthday push notifications (avoids duplicates)
 *   2. BirthdayCardShareLog     — optional: tracks WhatsApp/card shares
 *
 * Existing collections READ (never modified):
 *   Student, Teacher, User (parent), Parent
 */

const mongoose = require("mongoose");

// ─── 1. Birthday Notification Log ───────────────────────────────────────────
// Prevents duplicate push notifications for the same birthday in the same year.
const BirthdayNotificationLogSchema = new mongoose.Schema(
  {
    // Who the notification was ABOUT (the birthday person)
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      enum: ["student", "parent", "staff"],
      required: true,
    },
    // Year for which notification was sent — ensures one per year
    year: {
      type: Number,
      required: true,
    },
    // Who received the notification (parent userId)
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: one notification per target per recipient per year
BirthdayNotificationLogSchema.index(
  { targetId: 1, recipientUserId: 1, year: 1 },
  { unique: true }
);
BirthdayNotificationLogSchema.index({ sentAt: 1 });

// ─── 2. Birthday Card Share Log ──────────────────────────────────────────────
const BirthdayCardShareLogSchema = new mongoose.Schema(
  {
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetRole: {
      type: String,
      enum: ["student", "parent", "staff"],
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shareChannel: {
      type: String,
      enum: ["whatsapp", "copy_link", "download", "other"],
      default: "whatsapp",
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

BirthdayCardShareLogSchema.index({ targetId: 1 });
BirthdayCardShareLogSchema.index({ sharedBy: 1 });

const BirthdayNotificationLog = mongoose.model(
  "BirthdayNotificationLog",
  BirthdayNotificationLogSchema
);
const BirthdayCardShareLog = mongoose.model(
  "BirthdayCardShareLog",
  BirthdayCardShareLogSchema
);

module.exports = { BirthdayNotificationLog, BirthdayCardShareLog };
