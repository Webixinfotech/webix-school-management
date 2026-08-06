const mongoose = require('mongoose');

/**
 * StudentEnrollment — Links a student to a class with custom agreed fee
 * One record per student per class
 */
const StudentEnrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class ID is required'],
    },

    // Snapshot — avoid joins on billing
    studentName:    { type: String, trim: true, default: '' },
    studentAdmNo:   { type: String, trim: true, default: '' },
    className:      { type: String, trim: true, default: '' },
    classCode:      { type: String, trim: true, default: '' },
    classType:      { type: String, default: 'FIXED_TIME' },
    feeType:        { type: String, default: 'MONTHLY' },

    // Admin can override class baseFee for this student (discount/special case)
    agreedFee: {
      type: Number,
      default: 0,
      min: [0, 'Agreed fee cannot be negative'],
    },

    // Discount reason (optional)
    discountReason: {
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },

    // Monthly free hours — only for HOURS_BASED free-hour classes
    monthlyFreeHours: {
      type: Number,
      default: 0,
    },

    // Cumulative hours assigned so far for a FLEX_TIME (Flexible Time) class.
    // agreedFee for a FLEX_TIME enrollment is always Class.baseFee * this
    // value — every additional hour assignment bills baseFee * addedHours
    // as a fresh UNPAID Installment (see fee.service.js assignFlexiHours).
    flexiHoursAssigned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Snapshot of Class.isPrepaidHoursCard at enroll time. Marks this
    // enrollment as a prepaid Flexi Card tier rather than the legacy
    // monthly-free-hours allowance — drives attendance-deduction routing.
    isPrepaidHoursCard: {
      type: Boolean,
      default: false,
    },

    // Validity
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      default: null, // null = no expiry (ongoing)
    },

    status: {
      type: String,
      // Promoted/Retained/Left are only ever written by the promotion
      // workflow (fee.service.js promoteOneStudent/markEnrollmentLeft) —
      // no pre-existing code path produces these values.
      enum: ['Active', 'Expired', 'Cancelled', 'Promoted', 'Retained', 'Left'],
      default: 'Active',
    },

    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },

    // Academic session this enrollment belongs to. null on pre-existing
    // documents and on any create where no session is Active yet.
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSession',
      default: null,
    },

    // Set only by the promotion workflow — links a promoted/retained
    // enrollment back to the enrollment it was promoted from, for lineage
    // tracing. null for enrollments created the normal way (enrollStudent).
    promotedFromEnrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentEnrollment',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One active enrollment per student per class
StudentEnrollmentSchema.index(
  { studentId: 1, classId: 1, status: 1 },
  { name: 'idx_student_class_status' }
);
StudentEnrollmentSchema.index({ studentId: 1, status: 1 });
StudentEnrollmentSchema.index({ classId: 1, status: 1 });
StudentEnrollmentSchema.index({ validUntil: 1 });
StudentEnrollmentSchema.index({ sessionId: 1, status: 1 });

module.exports = mongoose.model('StudentEnrollment', StudentEnrollmentSchema);