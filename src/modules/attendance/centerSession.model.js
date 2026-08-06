const mongoose = require("mongoose");

const centerSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true, // Format: "YYYY-MM-DD" (Fast Search)
    },
    inTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    outTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "MISSED_CHECKOUT"],
      default: "ACTIVE",
    },
    totalStayMinutes: {
      type: Number,
      default: 0,
    },
    deductedFlexiHours: {
      type: Number,
      default: 0, // Kitne ghante kate gaye the
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true },
);

// Compound index taaki queries extremely fast run karein
centerSessionSchema.index({ studentId: 1, dateKey: 1, status: 1 });

const CenterSession = mongoose.model("CenterSession", centerSessionSchema);

module.exports = CenterSession;
