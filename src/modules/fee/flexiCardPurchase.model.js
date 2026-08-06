const mongoose = require('mongoose');
const Counter = require('../shared/counter.model');

/**
 * FlexiCardPurchase — one prepaid-hours card purchase (a ledger record).
 * Fully separate from Student.paidFlexiHours/freeFlexiHours/consumedFlexiHours
 * (the legacy global per-student monthly-free-hours + overage-billing pool)
 * so the two mechanisms never collide.
 */
const FlexiCardPurchaseSchema = new mongoose.Schema(
  {
    purchaseNo: {
      type: String,
      unique: true,
      trim: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentEnrollment',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },

    // Snapshot
    studentName:  { type: String, trim: true, default: '' },
    studentAdmNo: { type: String, trim: true, default: '' },
    className:    { type: String, trim: true, default: '' },
    classCode:    { type: String, trim: true, default: '' },

    hoursPurchased: {
      type: Number,
      required: [true, 'hoursPurchased is required'],
      min: [0, 'hoursPurchased cannot be negative'],
    },
    hoursConsumed:  { type: Number, default: 0 },
    hoursRemaining: {
      type: Number,
      required: true,
      min: [0, 'hoursRemaining cannot be negative'],
    },

    price:      { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountDue:  { type: Number, required: true },

    status: {
      type: String,
      enum: ['ACTIVE', 'EXHAUSTED', 'CANCELLED'],
      default: 'ACTIVE',
    },

    purchaseDate: { type: Date, default: Date.now },
    purchasedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:        { type: String, trim: true, default: '', maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate purchaseNo: BB-FLX-2026-0001
FlexiCardPurchaseSchema.pre('save', async function (next) {
  if (this.purchaseNo) return next();
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'flexicard-no' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const year = new Date().getFullYear();
    this.purchaseNo = `BB-FLX-${year}-${String(counter.seq).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

FlexiCardPurchaseSchema.index({ studentId: 1, status: 1 });
FlexiCardPurchaseSchema.index({ studentId: 1, classId: 1, purchaseDate: -1 });

module.exports = mongoose.model('FlexiCardPurchase', FlexiCardPurchaseSchema);
