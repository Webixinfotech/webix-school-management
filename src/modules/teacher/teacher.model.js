//----------------------new code-----------------------------

const mongoose = require("mongoose");
const Counter = require("../shared/counter.model");

const TeacherSchema = new mongoose.Schema(
  {
    // Basic Info
    employeeId: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Please provide teacher name"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Please provide phone number"],
      trim: true,
      match: [
        /^[6-9]\d{9}$/,
        "Please provide a valid 10-digit Indian phone number",
      ],
    },
    dob: {
      type: Date,
      default: null,
    },
    dateOfJoining: {
      type: Date,
      required: [true, "Please provide date of joining"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave"],
      default: "Active",
    },
    subjects: {
      type: String,
      default: "",
    },
    // classIds: [
    //   {
    //     type: String,
    //     trim: true,
    //   },
    // ],

    classIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    photo: {
      type: String,
      default: null,
    },
    // S3 storage key for photo deletion/cleanup
    photoKey: {
      type: String,
      default: null,
    },

    // Login Credentials
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user ID"],
      unique: true,
    },

    // ─── Employee Type & Shift Configuration ────────────────────────────────────
    employeeType: {
      type: String,
      enum: ["FIXED_TIME", "FIXED_HOURS", "FLEXIBLE"],
      default: "FIXED_TIME",
    },

    // Used when employeeType = FIXED_TIME
    fixedShift: {
      entryTime: { type: String }, // "HH:MM" 24hr format
      // entryTime: { type: String, default: "09:00" }, // "HH:MM" 24hr format
      exitTime: { type: String },
      // exitTime: { type: String, default: "17:00" },
      gracePeriodMinutes: { type: Number, default: 15 },
      halfDayThresholdHours: { type: Number, default: 3 }, // less than this = half day
      extraHoursPayment: { type: Boolean, default: false },
    },

    // Used when employeeType = FIXED_HOURS
    fixedHours: {
      minimumHours: { type: Number, default: 2 },
      halfDayThresholdHours: { type: Number, default: 1 }, // less than this = half day
      extraHoursPayment: { type: Boolean, default: false },
    },

    // Kahan dalo: monthlySalary field se pehle
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", ""],
      default: "",
    },

    // Salary
    monthlySalary: { type: Number, default: 0 },
    extraHourlyRate: { type: Number, default: 0 }, // Per hour rate for extra hours

    // Holiday Calendar assignment
    holidayCalendar: {
      type: String,
      enum: ["TEACHING", "NON_TEACHING"],
      default: "TEACHING",
    },

    // ─── Permissions ─────────────────────────────────────────────────────────────
    // Every flag here MUST be enforced by a real backend guard — see
    // src/middleware/auth.middleware.js (teacherPermissionGuard) and the
    // route files it's wired into. A permission that only hides a button
    // on the frontend is not a permission, it's a UI preference — don't
    // add one here unless a route actually checks it.
    permissions: {
      canViewStudentMobile: {
        type: Boolean,
        default: true,
      },
      canMarkAttendance: {
        type: Boolean,
        default: true,
      },
      canUploadPhotos: {
        type: Boolean,
        default: true,
      },
      canViewSalary: {
        type: Boolean,
        default: false,
      },
      canViewFeeInfo: {
        type: Boolean,
        default: false,
      },
      canDisplayStaffQR: {
        type: Boolean,
        default: false,
      },
      // Scanner side of ID-card attendance: lets this teacher scan ANOTHER
      // employee's static ID-card QR (Teacher.qrCode) to mark that
      // employee's attendance on their behalf — for staff without a phone.
      // See POST /api/employee-attendance/scan-by-id-card. Admin can always
      // do this regardless of this flag (teacherPermissionGuard convention).
      canScanEmployeeQR: {
        type: Boolean,
        default: false,
      },
      // Target side of ID-card attendance: whether THIS employee's own
      // attendance is allowed to be marked by someone else scanning their
      // ID-card QR (POST /api/employee-attendance/scan-by-id-card). Default
      // false — admin must opt each employee in.
      attendanceViaQR: {
        type: Boolean,
        default: false,
      },
      // Target side of the existing self-scan flow: whether THIS employee
      // may mark their own attendance via their own phone
      // (POST /api/employee-attendance/scan). Default true — preserves
      // pre-existing behaviour (every active teacher could already do this
      // before this flag existed); admin can turn it off per employee.
      attendanceViaPhone: {
        type: Boolean,
        default: true,
      },

      // ── Admin-equivalent module access (off by default; opt-in per teacher) ──
      // Fee Hub: enrollments, invoices, payments, wallet, installments,
      // flexi-card, collection/defaulter reports — same screens sub-admin uses.
      // Admin-only overrides (settings, wallet manual adjust, bulk invoice
      // generation, post-hoc payment/invoice/installment edits) stay
      // out of scope even with this on.
      canManageFees: {
        type: Boolean,
        default: false,
      },
      // Create/update student records (registration + edits). Deleting a
      // student stays admin-only.
      canManageStudents: {
        type: Boolean,
        default: false,
      },
      // Create/update teacher & staff records. Explicitly does NOT extend
      // to editing anyone's permissions or deleting a teacher — those stay
      // admin-only no matter what, to close off self/peer privilege escalation.
      canManageEmployees: {
        type: Boolean,
        default: false,
      },
      // Full admin birthday view (student + staff + parent, not just the
      // student-only list every teacher already sees) + manual notification trigger.
      canManageBirthdays: {
        type: Boolean,
        default: false,
      },
      // Enquiry list/detail/status/convert-to-student — same as admin's
      // Enquiry desk. Deleting an enquiry stays admin-only.
      canManageEnquiries: {
        type: Boolean,
        default: false,
      },
      // View student birthdays list (GET /api/birthdays/teacher/upcoming).
      // Default true — matches pre-existing behaviour (every teacher could
      // see this before the permission existed).
      canViewBirthdays: {
        type: Boolean,
        default: true,
      },
      // Create/update achievement certificates for students
      // (POST/PUT /api/documents, GET /api/documents/prefill,
      // GET /api/documents/issued-by-me). Default true — matches
      // pre-existing behaviour.
      canManageCertificates: {
        type: Boolean,
        default: true,
      },
      // Submit/update a class's daily activity report
      // (POST /api/daily-activity). Default true — matches pre-existing
      // behaviour.
      canManageDailyActivity: {
        type: Boolean,
        default: true,
      },
      // Full admin Event Scheduler access — upload/create/edit/delete school
      // calendar events, manage upload batches, assign events to parents
      // (the /api/calendar admin-management routes). Default false — this is
      // new access teachers never had before, opt-in per teacher.
      canManageCalendar: {
        type: Boolean,
        default: false,
      },

      // ── Inventory & Library module (see docs/library-inventory-management-proposal.md) ──
      // Library-side: catalog for lendable/sellable items (books, toys),
      // pricing, class-wise free settings, public visibility, available-for-sale.
      canManageLibraryCatalog: {
        type: Boolean,
        default: false,
      },
      // Library-side: borrow/return/renew and purchase transactions with
      // parents/students.
      canManageLibraryIssue: {
        type: Boolean,
        default: false,
      },
      // Library-side: read-only reports scoped to lendable/sellable items.
      canViewLibraryReports: {
        type: Boolean,
        default: false,
      },
      // Inventory-side: record incoming stock (Stock In).
      canManageInventoryStockIn: {
        type: Boolean,
        default: false,
      },
      // Inventory-side: issue items to teachers/classes (Stock Out). Items/
      // categories not marked direct-issue still require Admin approval
      // even with this permission on.
      canManageInventoryStockOut: {
        type: Boolean,
        default: false,
      },
      // Inventory-side: item master + category add/edit (consumables,
      // stationery, uniform, etc.)
      canManageInventoryCatalog: {
        type: Boolean,
        default: false,
      },
      // Inventory-side: read-only reports scoped to consumable/internal items.
      canViewInventoryReports: {
        type: Boolean,
        default: false,
      },

      aadhaarVerified: {
        type: Boolean,
        default: false,
      },
      policeVerified: {
        type: Boolean,
        default: false,
      },
    },

    // Admin Notes (private notes system)
    adminNotes: [
      {
        note: {
          type: String,
          required: [true, "Note content is required"],
          trim: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdByRole: {
          type: String,
          enum: ["admin"],
          required: true,
        },
        visibleToSubAdmin: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // QR Code
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Meta
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide creator user ID"],
    },
  },
  {
    timestamps: true,
  },
);

// Ensure virtuals are included in JSON responses
TeacherSchema.set("toJSON", { virtuals: true });
TeacherSchema.set("toObject", { virtuals: true });

// Pre-save hook to auto-generate employeeId and qrCode
TeacherSchema.pre("save", async function (next) {
  try {
    // Auto-generate employeeId using atomic Counter (race-condition safe)
    if (!this.employeeId) {
      const counter = await Counter.findOneAndUpdate(
        { name: "teacher-employee-id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      const paddedCount = String(counter.seq).padStart(3, "0");
      this.employeeId = `EMP${paddedCount}`;
    }

    // Auto-generate qrCode if not provided
    if (!this.qrCode) {
      this.qrCode = `BRAINBUILDER-TCH-${this.employeeId}-${Date.now()}`;
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Teacher", TeacherSchema);