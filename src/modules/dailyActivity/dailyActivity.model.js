const mongoose = require("mongoose");

// ─── Sub-schemas (no _id needed) ────────────────────────────────────────────

const SleepSchema = new mongoose.Schema(
  {
    quality: {
      type: String,
      enum: ["slept_well", "slept_little", "did_not_sleep", "napped"],
      default: null,
    },
  },
  { _id: false },
);

const FoodSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      enum: ["morning", "midday", "afternoon", "evening", null],
      default: null,
    },
    quantity: {
      type: String,
      enum: ["ate_well", "ate_little", "did_not_eat", "ate_everything", null],
      default: null,
    },
    note: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { _id: false },
);

const DiaperSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["changed", "not_required", "na", null],
      default: null,
    },
    changeTime: {
      type: String,
      enum: ["morning", "midday", "afternoon", "multiple", null],
      default: null,
    },
  },
  { _id: false },
);

// ─── Main Schema ─────────────────────────────────────────────────────────────

const DailyActivitySchema = new mongoose.Schema(
  {
    // Core references
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student ID is required"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Marked by user is required"],
    },
    markedByRole: {
      type: String,
      enum: ["admin", "sub-admin", "teacher"],
      required: true,
    },

    // Date key for fast lookup (YYYY-MM-DD)
    activityDate: {
      type: String,
      required: [true, "Activity date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"],
    },

    // ── Activity Sections ──────────────────────────────────────────────────

    sleep: { type: SleepSchema, default: () => ({}) },

    food: { type: FoodSchema, default: () => ({}) },

    diaper: { type: DiaperSchema, default: () => ({}) },

    mood: {
      type: String,
      enum: ["happy", "calm", "cranky", "sad", "unwell", null],
      default: null,
    },

    // Multi-select activities (e.g. painting, story_time, outdoor_play …)
    activities: {
      type: [String],
      default: [],
    },

    // Multi-select health concerns
    healthConcerns: {
      type: [String],
      default: [],
    },

    // Free-text note from teacher to parent
    teacherNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Teacher note cannot exceed 1000 characters"],
    },

    // Whether parent has been notified (health concern flow)
    parentNotified: {
      type: Boolean,
      default: false,
    },

    // Snapshot fields — avoids joins on read-heavy parent/admin views
    studentName: { type: String, default: "", trim: true },
    className: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Index for common queries
DailyActivitySchema.index({ studentId: 1, activityDate: -1 });
DailyActivitySchema.index({ classId: 1, activityDate: 1 });
DailyActivitySchema.index({ markedBy: 1, activityDate: -1 });
DailyActivitySchema.index({ activityDate: -1 });

// ─── Virtual ─────────────────────────────────────────────────────────────────

DailyActivitySchema.virtual("hasHealthConcern").get(function () {
  return this.healthConcerns && this.healthConcerns.length > 0;
});

module.exports = mongoose.model("DailyActivity", DailyActivitySchema);
