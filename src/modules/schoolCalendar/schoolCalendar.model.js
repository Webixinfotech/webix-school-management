/**
 * School Calendar Module — Model
 *
 * NEW COLLECTION: CalendarEvent
 * Existing collections read: User (parent), Student
 * No existing collections modified.
 */

const mongoose = require("mongoose");

const CalendarEventSchema = new mongoose.Schema(
  {
    // ── Core event fields (match Excel columns exactly) ──────────────────────
    day: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    // Original date string from Excel (for display, e.g. "13-04-2026")
    dateStr: {
      type: String,
      trim: true,
      default: "",
    },
    time: {
      type: String,
      trim: true,
      default: "",   // e.g. "Regular School Timing" or "5pm to 5:45pm"
    },
    className: {
      type: String,
      trim: true,
      default: "",   // e.g. "All Classes", "Nursery", "KG1 & KG2", "PG"
    },
    eventName: {
      type: String,
      trim: true,
      required: [true, "Event name is required"],
    },

    // ── Calendar type — key discriminator field ───────────────────────────────
    calType: {
      type: String,
      enum: ["SCHOOL_CAL", "KIDS_CLUB_CAL"],
      required: [true, "Calendar type is required"],
      default: "SCHOOL_CAL",
    },

    // ── Visual highlight (from Excel row color) ───────────────────────────────
    // Stored as hex string, e.g. "#FF0000" for red holiday rows
    rowColor: {
      type: String,
      default: null,    // null = no special color (white row)
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },
    isHighlighted: {
      type: Boolean,
      default: false,   // green/special rows
    },

    // ── Visibility control ────────────────────────────────────────────────────
    // visibleTo: [] → visible to ALL parents of matching enrollment type
    // visibleTo: [userId1, userId2] → only those specific parents
    visibleToAll: {
      type: Boolean,
      default: true,    // by default visible to all parents matching calType
    },
    visibleTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── Session / batch info ─────────────────────────────────────────────────
    session: {
      type: String,
      default: "",    // e.g. "April 2026"
    },

    // ── Upload batch tracking ─────────────────────────────────────────────────
    uploadBatchId: {
      type: String,
      default: null,  // UUID of the upload job — for bulk delete/replace
    },

    // ── Soft delete ───────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
CalendarEventSchema.index({ date: 1 });
CalendarEventSchema.index({ calType: 1 });
CalendarEventSchema.index({ isActive: 1, date: 1 });
CalendarEventSchema.index({ visibleTo: 1 });
CalendarEventSchema.index({ uploadBatchId: 1 });

// Compound: used for parent dashboard queries
CalendarEventSchema.index({ isActive: 1, calType: 1, date: 1 });

module.exports = mongoose.model("CalendarEvent", CalendarEventSchema);