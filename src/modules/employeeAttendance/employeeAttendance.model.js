

//-------------------------New Code-------------------------//

const mongoose = require("mongoose");

const EmployeeAttendanceSchema = new mongoose.Schema(
  {
    // ─── Core References ──────────────────────────────────────────────────────
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "Teacher ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Snapshot fields — fast reads without joins
    employeeId: { type: String, trim: true },
    employeeName: { type: String, trim: true },
    employeeType: {
      type: String,
      enum: ["FIXED_TIME", "FIXED_HOURS", "FLEXIBLE"],
      default: "FIXED_TIME",
    },

    // ─── Date ─────────────────────────────────────────────────────────────────
    attendanceDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"],
    },

    // ─── Check-in ─────────────────────────────────────────────────────────────
    checkInTime: { type: Date, default: null },
    checkInMethod: { type: String, enum: ["qr", "manual"], default: "qr" },
    checkInToken: { type: String, default: null },

    // ─── Check-out ────────────────────────────────────────────────────────────
    checkOutTime: { type: Date, default: null },
    checkOutMethod: {
      type: String,
      enum: ["qr", "manual", null],
      default: null,
    },
    checkOutToken: { type: String, default: null },

    // ─── Calculated Fields ────────────────────────────────────────────────────
    totalMinutes: { type: Number, default: null },
    extraMinutes: { type: Number, default: 0 },
    lateByMinutes: { type: Number, default: 0 },

    // ─── Status ───────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "Leave", "Holiday"],
      default: "Present",
    },
    isLate: { type: Boolean, default: false },
    isHalfDay: { type: Boolean, default: false },

    // ─── GPS (optional) ───────────────────────────────────────────────────────
    checkInLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // ─── Manual Override ──────────────────────────────────────────────────────
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    markedByRole: {
      type: String,
      // "peer" = marked by another employee scanning this employee's
      // static ID-card QR on their behalf (see scanStaticQR).
      // "system" = auto-marked Absent by the daily cron (see
      // employeeAttendance.cron.js / autoMarkAbsentForYesterday).
      enum: ["admin", "self", "peer", "system"],
      default: "self",
    },
    remarks: { type: String, default: "", trim: true, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

EmployeeAttendanceSchema.index(
  { teacherId: 1, attendanceDate: 1 },
  { unique: true, name: "uniq_employee_day" },
);
EmployeeAttendanceSchema.index({ attendanceDate: -1 });
EmployeeAttendanceSchema.index({ status: 1, attendanceDate: -1 });
EmployeeAttendanceSchema.index({ teacherId: 1, attendanceDate: -1 });

EmployeeAttendanceSchema.virtual("totalHoursDisplay").get(function () {
  if (!this.totalMinutes) return null;
  return `${Math.floor(this.totalMinutes / 60)}h ${this.totalMinutes % 60}m`;
});

EmployeeAttendanceSchema.virtual("extraHoursDisplay").get(function () {
  if (!this.extraMinutes) return "0h 0m";
  return `${Math.floor(this.extraMinutes / 60)}h ${this.extraMinutes % 60}m`;
});

module.exports = mongoose.model("EmployeeAttendance", EmployeeAttendanceSchema);


//-------------------------End of New Code-------------------------//