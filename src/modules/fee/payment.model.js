const mongoose = require('mongoose');
const Counter = require('../shared/counter.model');

/**
 * Payment — Every amount received from parent/guardian
 * Goes to wallet first, then auto-settles invoices
 */
const PaymentSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      unique: true,
      trim: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },

    // Snapshot
    studentName:  { type: String, trim: true, default: '' },
    studentAdmNo: { type: String, trim: true, default: '' },

    // Amount received
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Amount must be at least 1'],
    },

    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'],
      required: true,
    },

    // For UPI/bank/cheque — transaction reference
    transactionRef: {
      type: String,
      trim: true,
      default: '',
    },

    // Payment date (admin can backdate)
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // Wallet snapshot after this payment
    walletBalanceBefore: { type: Number, default: 0 },
    walletBalanceAfter:  { type: Number, default: 0 },

    // Which invoices were auto-settled from this payment (legacy FIFO
    // shape — INVOICE-type entries only). Kept for backward compatibility;
    // always populated alongside `allocations` below, in both payment modes.
    settledInvoices: [
      {
        invoiceId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
        invoiceNo:  { type: String },
        amountUsed: { type: Number },
      },
    ],

    // Generalized, polymorphic record of exactly what this payment was
    // applied to — superset of settledInvoices, spans Invoice/Installment/
    // Flexi Card. Always populated, in both legacy-FIFO and explicit-
    // allocation payment modes.
    allocations: [
      {
        billType:   { type: String, enum: ['INVOICE', 'INSTALLMENT', 'FLEXI_CARD'], required: true },
        billId:     { type: mongoose.Schema.Types.ObjectId, required: true },
        billNo:     { type: String, default: '' },
        amountUsed: { type: Number, required: true },
      },
    ],

    // Amount that went to advance (not used for any invoice)
    advanceAmount: { type: Number, default: 0 },

    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collectedByName: { type: String, trim: true, default: '' },

    remarks: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },

    // Edit audit trail — same shape/pattern as Attendance.editHistory.
    // One entry is pushed every time updatePayment() successfully changes
    // a tracked field, so admin can always see who edited what, when, and
    // why (note), regardless of who originally collected the payment.
    editHistory: {
      type: [
        {
          editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          editedByRole: {
            type: String,
            default: '',
          },
          editedAt: {
            type: Date,
            default: Date.now,
          },
          changedFields: {
            type: [String],
            default: [],
          },
          beforeValues: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
          },
          afterValues: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
          },
          note: {
            type: String,
            default: '',
            trim: true,
            maxlength: [500, 'Edit note cannot exceed 500 characters'],
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate receiptNo: BB-RCP-2026-0001
PaymentSchema.pre('save', async function (next) {
  if (this.receiptNo) return next();
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'receipt-no' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const year = new Date().getFullYear();
    this.receiptNo = `BB-RCP-${year}-${String(counter.seq).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

PaymentSchema.index({ studentId: 1, paymentDate: -1 });
PaymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);