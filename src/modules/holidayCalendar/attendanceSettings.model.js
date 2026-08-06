const mongoose = require('mongoose');

/**
 * AttendanceSettings — Global employee-attendance configuration (singleton document)
 * Admin can update these settings anytime
 */
const AttendanceSettingsSchema = new mongoose.Schema(
  {
    // Singleton key
    key: {
      type: String,
      default: 'global',
      unique: true,
    },

    // School-wide weekly off days for employee attendance — 0=Sunday..6=Saturday.
    // Days in this list are treated as a non-working day for every employee
    // (same as a Holiday) without needing a Holiday document created for
    // every single occurrence.
    weeklyOffDays: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [],
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('AttendanceSettings', AttendanceSettingsSchema);
