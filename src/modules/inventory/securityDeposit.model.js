const mongoose = require('mongoose');
const Counter = require('../shared/counter.model');

/**
 * SecurityDeposit — the money held against a borrowed item (Section 4.4).
 *
 * Deliberately NOT the fee module's Payment/StudentWallet: a deposit is
 * custodial (it must come back to the parent, untouched, when the item
 * does), not revenue that settles invoices. Mixing it into StudentWallet
 * would risk a deposit silently getting spent against a tuition due.
 * This gets the same payment-grade rigor (receipt number, payment mode,
 * collectedBy, audit trail) without touching the fee ledger.
 */
const SecurityDepositSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      unique: true,
      trim: true,
    },
    lendingTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LendingTransaction',
      required: true,
      unique: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0, 'Deposit amount cannot be negative'],
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'],
      required: true,
    },
    transactionRef: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['held', 'refunded', 'forfeited'],
      default: 'held',
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collectedAt: { type: Date, default: Date.now },

    // Filled in when status becomes 'refunded'. deductionAmount lets a
    // damaged-on-return item refund less than the full deposit without
    // needing a separate adjustment record.
    refund: {
      amount: { type: Number, default: 0 },
      deductionAmount: { type: Number, default: 0 },
      deductionReason: { type: String, trim: true, default: '' },
      mode: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other', null], default: null },
      transactionRef: { type: String, trim: true, default: '' },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      processedAt: { type: Date, default: null },
      note: { type: String, trim: true, default: '' },
    },

    // Filled in when status becomes 'forfeited' (item lost, or admin
    // manually forfeits — e.g. never returned after a long time).
    forfeitReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

SecurityDepositSchema.pre('save', async function (next) {
  if (this.receiptNo) return next();
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'deposit-receipt-no' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const year = new Date().getFullYear();
    this.receiptNo = `BB-DEP-${year}-${String(counter.seq).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

SecurityDepositSchema.index({ parent: 1, status: 1 });
SecurityDepositSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityDeposit', SecurityDepositSchema);
