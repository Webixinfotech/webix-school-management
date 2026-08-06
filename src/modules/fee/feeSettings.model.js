const mongoose = require('mongoose');

/**
 * FeeSettings — Global fee configuration (singleton document)
 * Admin can update these settings anytime
 */
const FeeSettingsSchema = new mongoose.Schema(
  {
    // Singleton key
    key: {
      type: String,
      default: 'global',
      unique: true,
    },

    // Per hour rate when student goes negative in flexi hours
    flexiHourlyRate: {
      type: Number,
      default: 100,
      min: [0, 'Rate cannot be negative'],
    },

    // Grace period before flexi deduction starts (minutes)
    flexiGracePeriodMinutes: {
      type: Number,
      default: 15,
      min: 0,
    },

    // Due date of monthly invoice (day of month)
    invoiceDueDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 28,
    },

    // Late fine amount per invoice (flat)
    lateFineAmount: {
      type: Number,
      default: 100,
      min: 0,
    },

    // Auto-generate invoices on 1st of month
    autoInvoiceEnabled: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model('FeeSettings', FeeSettingsSchema);