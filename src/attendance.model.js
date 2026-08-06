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
      enum: ["admin", "sub-admin", "teacher"],
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

module.exports = {
  Attendance: mongoose.model("Attendance", AttendanceSchema),
  ATTENDANCE_STATUSES,
  ATTENDANCE_METHODS,
  ATTENDANCE_SESSIONS,
};
