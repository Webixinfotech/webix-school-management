const mongoose = require('mongoose');

/**
 * StudentWallet — One wallet per student
 * All payments go here first, then auto-settle against invoices
 */
const StudentWalletSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },

    // Snapshot
    studentName:  { type: String, trim: true, default: '' },
    studentAdmNo: { type: String, trim: true, default: '' },

    // Current balance (can be 0 or positive — advance)
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Wallet balance cannot go negative'],
    },

    // Total ever received
    totalReceived: { type: Number, default: 0 },

    // Total ever used to settle invoices
    totalSettled: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


module.exports = mongoose.model('StudentWallet', StudentWalletSchema);