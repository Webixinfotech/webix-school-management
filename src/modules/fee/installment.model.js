const mongoose = require('mongoose');
const Counter = require('../shared/counter.model');

/**
 * Installment — one dated kist of an annual fee (feeType INSTALLMENT), or
 * the single one-time-fee row (feeType ONE_TIME). Generated once per
 * enrollment at enrollStudent() time; never touched by the monthly Invoice
 * cron.
 */
const InstallmentSchema = new mongoose.Schema(
  {
    installmentNo: {
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

    // Snapshot — avoid joins on billing
    studentName:  { type: String, trim: true, default: '' },
    studentAdmNo: { type: String, trim: true, default: '' },
    className:    { type: String, trim: true, default: '' },
    classCode:    { type: String, trim: true, default: '' },

    seq:   { type: Number, required: true },
    label: { type: String, trim: true, default: '' },

    amount: {
      type: Number,
      required: [true, 'Installment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    amountPaid: { type: Number, default: 0 },
    adjustmentAmount: { type: Number, default: 0 },
    adjustmentReason: { type: String, trim: true, default: '' },
    netDue: {
      type: Number,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'WAIVED'],
      default: 'UNPAID',
    },

    generatedBy: { type: String, enum: ['system', 'admin'], default: 'system' },
    generatedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    notes: { type: String, trim: true, default: '', maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate installmentNo: BB-INST-2026-0001
InstallmentSchema.pre('save', async function (next) {
  if (this.installmentNo) return next();
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'installment-no' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const year = new Date().getFullYear();
    this.installmentNo = `BB-INST-${year}-${String(counter.seq).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

InstallmentSchema.index(
  { enrollmentId: 1, seq: 1 },
  { unique: true, name: 'uniq_enrollment_installment_seq' }
);
InstallmentSchema.index({ studentId: 1, status: 1 });
InstallmentSchema.index({ dueDate: 1, status: 1 });
InstallmentSchema.index({ classId: 1, status: 1 });

module.exports = mongoose.model('Installment', InstallmentSchema);
