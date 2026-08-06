const mongoose = require('mongoose');
const Counter = require('../shared/counter.model');

const TuitionLineSchema = new mongoose.Schema(
  {
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentEnrollment' },
    classId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    className:    { type: String, default: '' },
    classCode:    { type: String, default: '' },
    agreedFee:    { type: Number, default: 0 },
    feeType:      { type: String, default: 'MONTHLY' },
  },
  { _id: false }
);

/**
 * Invoice — Monthly consolidated bill per student
 * Generated on 1st of each month by cron OR manually by admin
 */
const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
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

    // Billing period
    billingMonth: { type: Number, required: true, min: 1, max: 12 },
    billingYear:  { type: Number, required: true },

    // ── Line items ────────────────────────────────────────────────────────────
    tuitionLines: { type: [TuitionLineSchema], default: [] },
    tuitionTotal: { type: Number, default: 0 },

    // Flexi negative hours charge
    flexiNegativeHours: { type: Number, default: 0 },
    flexiChargeRate:    { type: Number, default: 100 },
    flexiCharge:        { type: Number, default: 0 },

    // Late fine from previous invoice
    lateFine: { type: Number, default: 0 },

    // Grand total
    totalDue: { type: Number, default: 0 },

    // ── Payment settlement ────────────────────────────────────────────────────
    walletAmountUsed: { type: Number, default: 0 },
    netDue:           { type: Number, default: 0 },
    amountPaid:       { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'WAIVED'],
      default: 'UNPAID',
    },

    dueDate: { type: Date, default: null },

    // Admin can waive or adjust
    adjustmentAmount: { type: Number, default: 0 },
    adjustmentReason: { type: String, trim: true, default: '' },

    generatedBy:   { type: String, enum: ['system', 'admin'], default: 'system' },
    generatedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    notes: { type: String, trim: true, default: '', maxlength: 500 },

    // Academic session this invoice belongs to. null on pre-existing
    // documents and on any create where no session is Active yet.
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate invoiceNo: BB-INV-2026-0001
InvoiceSchema.pre('save', async function (next) {
  if (this.invoiceNo) return next();
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: 'invoice-no' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const year = new Date().getFullYear();
    this.invoiceNo = `BB-INV-${year}-${String(counter.seq).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

// InvoiceSchema.index({ studentId: 1, billingMonth: 1, billingYear: 1 });
InvoiceSchema.index(
  { studentId: 1, billingMonth: 1, billingYear: 1 },
  { unique: true, name: 'uniq_student_monthly_invoice' }
);
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ billingMonth: 1, billingYear: 1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });
InvoiceSchema.index({ sessionId: 1, billingYear: 1, billingMonth: 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);