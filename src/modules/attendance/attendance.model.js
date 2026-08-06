const mongoose = require("mongoose");

const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "Leave"];
const ATTENDANCE_METHODS = ["qr", "manual", "system"];
const ATTENDANCE_SESSIONS = ["FULL_DAY", "MORNING", "AFTERNOON", "EVENING"];

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    studentAdmissionNo: {
      type: String,
      required: [true, "Student admission number is required"],
      trim: true,
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    qrCode: {
      type: String,
      default: "",
      trim: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    classCode: {
      type: String,
      default: "",
      trim: true,
    },
    className: {
      type: String,
      default: "",
      trim: true,
    },
    section: {
      type: String,
      default: "",
      trim: true,
    },
    attendanceDate: {
      type: Date,
      required: [true, "Attendance date is required"],
    },
    attendanceDateKey: {
      type: String,
      required: [true, "Attendance date key is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Attendance date key must be YYYY-MM-DD"],
    },
    sessionLabel: {
      type: String,
      enum: ATTENDANCE_SESSIONS,
      default: "FULL_DAY",
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      default: "Present",
    },
    method: {
      type: String,
      enum: ATTENDANCE_METHODS,
      default: "manual",
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Remarks cannot exceed 500 characters"],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Marked by user is required"],
    },
    markedByRole: {
      type: String,
      enum: ["admin", "teacher", "system"],
      required: [true, "Marked by role is required"],
    },
    markedByTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    // Fields for class-level auto check-out
    checkInTime: {
      type: Date,
      default: Date.now, // Defaults to when attendance is marked 'Present'
    },
    checkOutTime: {
      type: Date, // Set when student leaves the class or auto-checked out
    },
    isAutoCheckedOut: {
      type: Boolean,
      default: false, // True if checkOutTime was set by cron job
    },
    // STEP 2a: New fields for stay time tracking
    stayMinutes: {
      type: Number,
      default: null,
    },
    scheduledMinutes: {
      type: Number,
      default: null,
    },
    extraMinutes: {
      type: Number,
      default: null,
    },
    flexiHoursDeducted: {
      type: Number,
      default: 0,
    },
    // Which FlexiCardPurchase (if any) absorbed flexiHoursDeducted for this
    // record. null means the deduction went through the legacy global
    // Student.consumedFlexiHours pool instead (ordinary HOURS_BASED class,
    // not a prepaid card).
    flexiCardPurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FlexiCardPurchase",
      default: null,
    },
    checkoutSource: {
      type: String,
      enum: ["center_session", "manual", "cron_auto", null],
      default: null,
    },
    // Edit audit trail — same shape/pattern as Enquiry.auditTrail.
    // One entry is pushed every time updateAttendance() successfully
    // changes a tracked field, so admin can always see who edited what,
    // when, and why (note), regardless of who originally marked it.
    editHistory: {
      type: [
        {
          editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          editedByRole: {
            type: String,
            default: "",
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
            default: "",
            trim: true,
            maxlength: [500, "Edit note cannot exceed 500 characters"],
          },
        },
      ],
      default: [],
    },

    // Academic session (academic year) this record belongs to — unrelated
    // to `sessionLabel` above, which means time-of-day (FULL_DAY/MORNING/
    // etc). null on pre-existing documents and on any create where no
    // AcademicSession is Active yet.
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

AttendanceSchema.index(
  { studentId: 1, attendanceDateKey: 1, sessionLabel: 1 },
  { unique: true, name: "uniq_student_daily_session_attendance" },
);
AttendanceSchema.index({ attendanceDateKey: 1, status: 1 });
AttendanceSchema.index({ classId: 1, attendanceDateKey: 1 });
AttendanceSchema.index({ markedByTeacherId: 1, attendanceDateKey: 1 });
AttendanceSchema.index({ studentAdmissionNo: 1 });
AttendanceSchema.index({ sessionId: 1, attendanceDateKey: 1 });

module.exports = {
  Attendance: mongoose.model("Attendance", AttendanceSchema),
  ATTENDANCE_STATUSES,
  ATTENDANCE_METHODS,
  ATTENDANCE_SESSIONS,
};