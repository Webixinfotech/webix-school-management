const mongoose = require("mongoose");

/**
 * AcademicSession — an academic year (e.g. "2026-27").
 * Status lifecycle: Upcoming -> Active -> Completed.
 * Only ever one "Active" session at a time; enforced in the service layer
 * (activateSession), never at the schema level.
 */
const AcademicSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Session name is required"],
      trim: true,
      unique: true,
    },
    startDate: {
      type: Date,
      required: [true, "Session start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Session end date is required"],
    },
    status: {
      type: String,
      enum: ["Upcoming", "Active", "Completed"],
      default: "Upcoming",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

AcademicSessionSchema.index({ status: 1 });

module.exports = mongoose.model("AcademicSession", AcademicSessionSchema);
