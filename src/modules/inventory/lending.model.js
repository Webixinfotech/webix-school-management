const mongoose = require('mongoose');

/**
 * LendingTransaction — the Library core (Section 4.4): a parent borrowing
 * or buying an item for/with their child. `isOverdue` is computed on read
 * (status stays 'active' until actually returned) so a cron isn't required
 * just to flip a status flag — see lending.service.js.
 */
const LendingTransactionSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    quantity: { type: Number, default: 1, min: 1 },
    transactionType: {
      type: String,
      enum: ['borrow', 'purchase'],
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
    status: {
      type: String,
      enum: ['active', 'returned', 'completed', 'cancelled'],
      default: 'active',
    },
    issueDate: { type: Date, default: Date.now },
    // Required for transactionType 'borrow'.
    dueDate: { type: Date, default: null },
    returnDate: { type: Date, default: null },
    returnCondition: {
      type: String,
      enum: ['good', 'damaged', 'lost', null],
      default: null,
    },
    // Section 4.6 resolution snapshot — kept even if class-pricing settings
    // change later, so past transactions stay historically accurate.
    priceCharged: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: false },
    freeRuleSource: {
      type: String,
      enum: ['item', 'category', 'none'],
      default: 'none',
    },
    // Section 4.4 deposit safety check — denormalized snapshot of the
    // amount collected, for quick display without a populate. The
    // authoritative record (receipt, payment mode, refund/forfeit detail)
    // lives on the linked SecurityDeposit — see securityDeposit.model.js.
    depositCollected: { type: Number, default: 0, min: 0 },
    securityDeposit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SecurityDeposit',
      default: null,
    },
    notes: { type: String, trim: true, default: '', maxlength: 500 },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Notification dedupe flags — see lending.service.js reminder sweep.
    dueReminderSent: { type: Boolean, default: false },
    overdueAlertSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

LendingTransactionSchema.index({ parent: 1, createdAt: -1 });
LendingTransactionSchema.index({ student: 1, createdAt: -1 });
LendingTransactionSchema.index({ status: 1, dueDate: 1 });
LendingTransactionSchema.index({ item: 1, createdAt: -1 });

module.exports = mongoose.model('LendingTransaction', LendingTransactionSchema);
